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
import {IWETH} from "../src/interfaces/IWETH.sol";
import {MockERC8004Registry} from "../test/mocks/MockERC8004Registry.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {TraitData} from "./TraitData.sol";

/// @title DeploySepolia
/// @notice Sepolia testnet deployment script with mock ERC-8004 registry
contract DeploySepolia is Script {
    // Deployment addresses
    MockERC8004Registry public registry;
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;
    AnonsToken public token;
    TimelockController public timelock;
    AnonsDAO public dao;
    AnonsAuctionHouse public auctionHouse;

    // Configuration
    address public clawdia;
    address public constant WETH = 0x4200000000000000000000000000000000000006; // Base Sepolia WETH
    uint256 public timelockDelay = 12 hours; // Shorter for testnet
    IAnonsSeeder.Seed public clawdiaSeed;

    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        clawdia = vm.envAddress("CLAWDIA_ADDRESS");

        require(clawdia != address(0), "CLAWDIA_ADDRESS not set");

        // Load Clawdia's Anon #0 seed (trait indices)
        clawdiaSeed = IAnonsSeeder.Seed({
            background: uint8(vm.envOr("CLAWDIA_BACKGROUND", uint256(0))),
            head: uint8(vm.envOr("CLAWDIA_HEAD", uint256(0))),
            visor: uint8(vm.envOr("CLAWDIA_VISOR", uint256(0))),
            antenna: uint8(vm.envOr("CLAWDIA_ANTENNA", uint256(0))),
            body: uint8(vm.envOr("CLAWDIA_BODY", uint256(0))),
            accessory: uint8(vm.envOr("CLAWDIA_ACCESSORY", uint256(0))),
            isDusk: vm.envOr("CLAWDIA_IS_DUSK", false)
        });

        console.log("Deploying Anons DAO to Sepolia testnet");
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

        // 0. Deploy MockERC8004Registry
        registry = new MockERC8004Registry();
        console.log("0. MockERC8004Registry deployed:", address(registry));

        // Register Clawdia as an agent for testing
        registry.registerAgent(clawdia);
        console.log("   Clawdia registered as agent");

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
        address[] memory proposers = new address[](1);
        proposers[0] = address(1); // Temporary, will be replaced by DAO
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute
        timelock = new TimelockController(timelockDelay, proposers, executors, msg.sender);
        console.log("5. TimelockController deployed:", address(timelock));

        // 6. Deploy AnonsDAO
        dao = new AnonsDAO(token, IERC8004Registry(address(registry)), timelock, clawdia);
        console.log("6. AnonsDAO deployed:", address(dao));

        // 7. Deploy AnonsAuctionHouse
        auctionHouse = new AnonsAuctionHouse(
            token,
            IERC8004Registry(address(registry)),
            IWETH(WETH),
            address(timelock), // Treasury
            clawdia // Creator
        );
        console.log("7. AnonsAuctionHouse deployed:", address(auctionHouse));

        // 8. Grant minter role to AuctionHouse
        token.setMinter(address(auctionHouse));
        console.log("8. Minter set to AuctionHouse");

        vm.stopBroadcast();

        // 9. Timelock roles need to be configured manually
        console.log("9. MANUAL STEP: Configure timelock roles - see deployment summary");

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
        console.log("    ANONS DAO SEPOLIA DEPLOYMENT       ");
        console.log("========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("-------------------");
        console.log("Registry:      ", address(registry));
        console.log("Descriptor:    ", address(descriptor));
        console.log("Seeder:        ", address(seeder));
        console.log("Token:         ", address(token));
        console.log("Timelock:      ", address(timelock));
        console.log("DAO:           ", address(dao));
        console.log("AuctionHouse:  ", address(auctionHouse));
        console.log("");
        console.log("Configuration:");
        console.log("--------------");
        console.log("Clawdia:           ", clawdia);
        console.log("Timelock Delay:    ", timelockDelay);
        console.log("");
        console.log("Next Steps:");
        console.log("-----------");
        console.log("1. Verify contracts on Etherscan");
        console.log("2. Call auctionHouse.unpause() to start first auction");
        console.log("3. Test bidding and settlement");
        console.log("4. Test governance proposals");
        console.log("");
        console.log("========================================");
    }
}
