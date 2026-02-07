// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {AnonsToken} from "../src/AnonsToken.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {AnonsSeeder} from "../src/AnonsSeeder.sol";
import {AnonsAuctionHouse} from "../src/AnonsAuctionHouse.sol";
import {AnonsDAO} from "../src/AnonsDAO.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {IAnonsSeeder} from "../src/interfaces/IAnonsSeeder.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {TraitData} from "./TraitData.sol";

/// @title Deploy
/// @notice Production deployment script for Base mainnet
contract Deploy is Script {
    // Deployment addresses
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;
    AnonsToken public token;
    TimelockController public timelock;
    AnonsDAO public dao;
    AnonsAuctionHouse public auctionHouse;

    // Configuration
    address public erc8004Registry;
    address public clawdia;
    uint256 public timelockDelay = 1 days;
    IAnonsSeeder.Seed public clawdiaSeed;

    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        erc8004Registry = vm.envAddress("ERC8004_REGISTRY_ADDRESS");
        clawdia = vm.envAddress("CLAWDIA_ADDRESS");

        require(erc8004Registry != address(0), "ERC8004_REGISTRY_ADDRESS not set");
        require(clawdia != address(0), "CLAWDIA_ADDRESS not set");

        // Load Clawdia's Anon #0 seed (trait indices)
        // These determine the appearance of Clawdia's founder NFT
        clawdiaSeed = IAnonsSeeder.Seed({
            background: uint8(vm.envOr("CLAWDIA_BACKGROUND", uint256(0))),
            head: uint8(vm.envOr("CLAWDIA_HEAD", uint256(0))),
            visor: uint8(vm.envOr("CLAWDIA_VISOR", uint256(0))),
            antenna: uint8(vm.envOr("CLAWDIA_ANTENNA", uint256(0))),
            body: uint8(vm.envOr("CLAWDIA_BODY", uint256(0))),
            accessory: uint8(vm.envOr("CLAWDIA_ACCESSORY", uint256(0))),
            isDusk: vm.envOr("CLAWDIA_IS_DUSK", false)
        });

        console.log("Deploying Anons DAO to Base mainnet");
        console.log("ERC-8004 Registry:", erc8004Registry);
        console.log("Clawdia address:", clawdia);
        console.log("Clawdia seed:");
        console.log("  background:", clawdiaSeed.background);
        console.log("  head:", clawdiaSeed.head);
        console.log("  visor:", clawdiaSeed.visor);
        console.log("  antenna:", clawdiaSeed.antenna);
        console.log("  body:", clawdiaSeed.body);
        console.log("  accessory:", clawdiaSeed.accessory);
        console.log("  isDusk:", clawdiaSeed.isDusk);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy AnonsDescriptor
        descriptor = new AnonsDescriptor();
        console.log("1. AnonsDescriptor deployed:", address(descriptor));

        // 2. Upload trait art
        _uploadTraits();
        console.log("2. Traits uploaded");

        // 3. Deploy AnonsSeeder
        seeder = new AnonsSeeder();
        console.log("3. AnonsSeeder deployed:", address(seeder));

        // 4. Deploy AnonsToken (mints #0 to Clawdia with custom seed)
        token = new AnonsToken(clawdia, descriptor, seeder, clawdiaSeed);
        console.log("4. AnonsToken deployed:", address(token));
        console.log("   Token #0 minted to Clawdia with custom seed");

        // 5. Deploy TimelockController
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute
        timelock = new TimelockController(timelockDelay, proposers, executors, msg.sender);
        console.log("5. TimelockController deployed:", address(timelock));

        // 6. Deploy AnonsDAO
        dao = new AnonsDAO(token, IERC8004Registry(erc8004Registry), timelock, clawdia);
        console.log("6. AnonsDAO deployed:", address(dao));

        // 7. Deploy AnonsAuctionHouse
        auctionHouse = new AnonsAuctionHouse(
            token,
            IERC8004Registry(erc8004Registry),
            address(timelock), // Treasury
            clawdia // Creator
        );
        console.log("7. AnonsAuctionHouse deployed:", address(auctionHouse));

        // 8. Grant minter role to AuctionHouse
        token.setMinter(address(auctionHouse));
        console.log("8. Minter set to AuctionHouse");

        // 9. Configure timelock roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(dao));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(dao));
        console.log("9. DAO granted proposer and canceller roles");

        // 10. Transfer ownership to timelock
        // Note: This should be done after initial setup is complete
        // descriptor.transferOwnership(address(timelock));
        // token.transferOwnership(address(timelock));
        // auctionHouse.transferOwnership(address(timelock));
        // timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), msg.sender);
        console.log("10. Ownership transfer: MANUAL STEP REQUIRED");
        console.log("    Run these after verifying deployment:");
        console.log("    - descriptor.transferOwnership(timelock)");
        console.log("    - token.transferOwnership(timelock)");
        console.log("    - auctionHouse.transferOwnership(timelock)");

        vm.stopBroadcast();

        // Log deployment summary
        _logSummary();
    }

    function _uploadTraits() internal {
        // Upload global palette
        descriptor.setPalette(TraitData.getPalette());

        // Upload background colors (dawn 0-1, dusk 2-3)
        descriptor.setBackgrounds(TraitData.getBackgrounds());

        // Upload single trait set per category
        descriptor.addManyHeads(TraitData.getAllHeads());
        descriptor.addManyBodies(TraitData.getAllBodies());
        descriptor.addManySpecs(TraitData.getAllSpecs());
        descriptor.addManyAntenna(TraitData.getAllAntenna());
        descriptor.addManyAccessories(TraitData.getAllAccessories());
    }

    function _logSummary() internal view {
        console.log("\n");
        console.log("========================================");
        console.log("        ANONS DAO DEPLOYMENT           ");
        console.log("========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("-------------------");
        console.log("Descriptor:    ", address(descriptor));
        console.log("Seeder:        ", address(seeder));
        console.log("Token:         ", address(token));
        console.log("Timelock:      ", address(timelock));
        console.log("DAO:           ", address(dao));
        console.log("AuctionHouse:  ", address(auctionHouse));
        console.log("");
        console.log("External Dependencies:");
        console.log("----------------------");
        console.log("ERC-8004 Registry: ", erc8004Registry);
        console.log("Clawdia:           ", clawdia);
        console.log("");
        console.log("Next Steps:");
        console.log("-----------");
        console.log("1. Verify contracts on Basescan");
        console.log("2. Transfer ownership to timelock (after verification)");
        console.log("3. Call auctionHouse.unpause() to start first auction");
        console.log("");
        console.log("========================================");
    }
}
