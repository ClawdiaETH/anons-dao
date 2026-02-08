// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {AnonsToken} from "../src/AnonsToken.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {AnonsSeeder} from "../src/AnonsSeeder.sol";
import {AnonsAuctionHouse} from "../src/AnonsAuctionHouse.sol";
import {AnonsDAO} from "../src/AnonsDAO.sol";
import {MockERC8004Registry} from "../test/mocks/MockERC8004Registry.sol";
import {MockWETH} from "../test/mocks/MockWETH.sol";
import {IAnonsSeeder} from "../src/interfaces/IAnonsSeeder.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {TraitData} from "./TraitData.sol";

/// @title DeployLocal
/// @notice Deployment script for local Anvil testing
contract DeployLocal is Script {
    // Deployment addresses
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;
    AnonsToken public token;
    TimelockController public timelock;
    AnonsDAO public dao;
    AnonsAuctionHouse public auctionHouse;
    MockERC8004Registry public registry;
    MockWETH public weth;

    // Configuration
    address public clawdia;
    uint256 public timelockDelay = 1 days;
    IAnonsSeeder.Seed public clawdiaSeed;

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)); // Default Anvil key
        clawdia = vm.envOr("CLAWDIA_ADDRESS", address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8)); // Anvil account 1

        // Load Clawdia's Anon #0 seed (defaults to all zeroes for local testing)
        clawdiaSeed = IAnonsSeeder.Seed({
            background: uint8(vm.envOr("CLAWDIA_BACKGROUND", uint256(0))),
            head: uint8(vm.envOr("CLAWDIA_HEAD", uint256(0))),
            visor: uint8(vm.envOr("CLAWDIA_VISOR", uint256(0))),
            antenna: uint8(vm.envOr("CLAWDIA_ANTENNA", uint256(0))),
            body: uint8(vm.envOr("CLAWDIA_BODY", uint256(0))),
            accessory: uint8(vm.envOr("CLAWDIA_ACCESSORY", uint256(0))),
            isDusk: vm.envOr("CLAWDIA_IS_DUSK", false)
        });

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy mock ERC-8004 registry and WETH
        registry = new MockERC8004Registry();
        weth = new MockWETH();
        console.log("MockERC8004Registry deployed:", address(registry));
        console.log("MockWETH deployed:", address(weth));

        // 2. Deploy AnonsDescriptor
        descriptor = new AnonsDescriptor();
        console.log("AnonsDescriptor deployed:", address(descriptor));

        // 3. Upload trait art
        _uploadTraits();

        // 4. Deploy AnonsSeeder
        seeder = new AnonsSeeder();
        console.log("AnonsSeeder deployed:", address(seeder));

        // 5. Deploy AnonsToken (mints #0 to Clawdia with custom seed)
        token = new AnonsToken(clawdia, descriptor, seeder, clawdiaSeed);
        console.log("AnonsToken deployed:", address(token));
        console.log("Token #0 minted to Clawdia:", clawdia);
        console.log("  Seed: bg=", clawdiaSeed.background, "head=", clawdiaSeed.head);

        // 6. Deploy TimelockController
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute
        timelock = new TimelockController(timelockDelay, proposers, executors, msg.sender);
        console.log("TimelockController deployed:", address(timelock));

        // 7. Deploy AnonsDAO
        dao = new AnonsDAO(token, registry, timelock, clawdia);
        console.log("AnonsDAO deployed:", address(dao));

        // 8. Deploy AnonsAuctionHouse
        auctionHouse = new AnonsAuctionHouse(token, registry, weth, address(timelock), clawdia);
        console.log("AnonsAuctionHouse deployed:", address(auctionHouse));

        // 9. Configure permissions
        token.setMinter(address(auctionHouse));
        console.log("Minter set to AuctionHouse");

        timelock.grantRole(timelock.PROPOSER_ROLE(), address(dao));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(dao));
        console.log("DAO granted proposer and canceller roles");

        // 10. Register Clawdia as agent (for testing)
        registry.registerAgent(clawdia);
        console.log("Clawdia registered as agent");

        // Note: Auction house starts paused
        // Call auctionHouse.unpause() to start first auction

        vm.stopBroadcast();

        // Log summary
        console.log("\n=== Deployment Summary ===");
        console.log("Registry:", address(registry));
        console.log("Descriptor:", address(descriptor));
        console.log("Seeder:", address(seeder));
        console.log("Token:", address(token));
        console.log("Timelock:", address(timelock));
        console.log("DAO:", address(dao));
        console.log("AuctionHouse:", address(auctionHouse));
        console.log("\nTraits uploaded:");
        console.log("  Palette: 255 colors");
        console.log("  Heads: 189, Bodies: 30, Specs: 77, Antennas: 16, Accessories: 145");
        console.log("  Backgrounds: 4 (2 dawn, 2 dusk)");
        console.log("\nTo start auctions, call: auctionHouse.unpause()");
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

        console.log("Traits uploaded: 457 total");
    }
}
