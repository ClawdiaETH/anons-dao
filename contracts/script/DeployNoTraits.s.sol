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
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title DeployNoTraits
/// @notice Deploy contracts WITHOUT trait uploads (upload separately)
contract DeployNoTraits is Script {
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;
    AnonsToken public token;
    TimelockController public timelock;
    AnonsDAO public dao;
    AnonsAuctionHouse public auctionHouse;

    address public erc8004Registry = 0x00256C0D814c455425A0699D5eEE2A7DB7A5519c;
    address public clawdia = 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9;
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    uint256 public timelockDelay = 1 days;

    function run() external {
        IAnonsSeeder.Seed memory clawdiaSeed = IAnonsSeeder.Seed({
            background: 1,
            head: 48,
            visor: 7,
            antenna: 3,
            body: 7,
            accessory: 69,
            isDusk: true
        });

        console.log("Deploying Anons DAO (NO TRAITS) to Base mainnet");
        
        vm.startBroadcast();

        // 1. Deploy AnonsDescriptor (NO trait upload)
        descriptor = new AnonsDescriptor();
        console.log("1. AnonsDescriptor deployed:", address(descriptor));

        // 2. Deploy AnonsSeeder
        seeder = new AnonsSeeder();
        console.log("2. AnonsSeeder deployed:", address(seeder));

        // 3. Deploy AnonsToken (mints #0 to Clawdia)
        token = new AnonsToken(clawdia, descriptor, seeder, clawdiaSeed);
        console.log("3. AnonsToken deployed:", address(token));
        console.log("   Anon #0 minted to Clawdia");

        // 4. Deploy TimelockController
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0);
        timelock = new TimelockController(timelockDelay, proposers, executors, msg.sender);
        console.log("4. TimelockController deployed:", address(timelock));

        // 5. Deploy AnonsDAO
        dao = new AnonsDAO(token, IERC8004Registry(erc8004Registry), timelock, clawdia);
        console.log("5. AnonsDAO deployed:", address(dao));

        // 6. Deploy AnonsAuctionHouse (STARTS PAUSED)
        auctionHouse = new AnonsAuctionHouse(
            token,
            IERC8004Registry(erc8004Registry),
            IWETH(WETH),
            address(dao),
            clawdia
        );
        console.log("6. AnonsAuctionHouse deployed:", address(auctionHouse));
        console.log("   (Started PAUSED - ready for trait upload)");

        // 7. Set auction house as minter
        token.setMinter(address(auctionHouse));
        console.log("7. Minter set to AuctionHouse");

        // 8. Grant DAO roles in timelock
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 cancellerRole = timelock.CANCELLER_ROLE();
        timelock.grantRole(proposerRole, address(dao));
        timelock.grantRole(cancellerRole, address(dao));
        console.log("8. DAO granted proposer and canceller roles");

        vm.stopBroadcast();

        console.log("\n========================================");
        console.log("      ANONS DAO DEPLOYMENT (NO TRAITS)");
        console.log("========================================");
        console.log("\nContract Addresses:");
        console.log("-------------------");
        console.log("Descriptor:    ", address(descriptor));
        console.log("Seeder:        ", address(seeder));
        console.log("Token:         ", address(token));
        console.log("Timelock:      ", address(timelock));
        console.log("DAO:           ", address(dao));
        console.log("AuctionHouse:  ", address(auctionHouse));
        console.log("\nNext Steps:");
        console.log("1. Upload traits using Upload scripts");
        console.log("2. Verify contracts on Basescan");
        console.log("3. Call auctionHouse.unpause() when ready");
        console.log("========================================\n");
    }
}
