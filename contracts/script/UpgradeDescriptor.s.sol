// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {IAnonsToken} from "../src/interfaces/IAnonsToken.sol";

/// @title UpgradeDescriptor
/// @notice Deploys new AnonsDescriptor with fixed specs rendering and updates the token contract
contract UpgradeDescriptor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("=== Upgrading AnonsDescriptor ===");
        console2.log("Deployer:", deployer);
        console2.log("Token:", tokenAddress);
        console2.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new descriptor with fixed specs rendering
        console2.log("1. Deploying new AnonsDescriptor...");
        AnonsDescriptor newDescriptor = new AnonsDescriptor();
        console2.log("   New Descriptor:", address(newDescriptor));
        console2.log("");

        // Transfer ownership to token owner (should be the deployer)
        console2.log("2. Transferring ownership to deployer...");
        newDescriptor.transferOwnership(deployer);
        console2.log("   Ownership transferred");
        console2.log("");

        vm.stopBroadcast();

        console2.log("=== Deployment Complete ===");
        console2.log("");
        console2.log("New Descriptor Address:", address(newDescriptor));
        console2.log("");
        console2.log("NEXT STEPS:");
        console2.log("1. Run UploadPalette.s.sol with DESCRIPTOR_ADDRESS=", address(newDescriptor));
        console2.log("2. Run Upload1Backgrounds.s.sol");
        console2.log("3. Run Upload2Bodies.s.sol");
        console2.log("4. Run Upload3Specs.s.sol");
        console2.log("5. Run Upload4Antenna.s.sol");
        console2.log("6. Run Upload5Heads.s.sol");
        console2.log("7. Run Upload6Accessories.s.sol");
        console2.log("8. Run UploadTraitNames.s.sol");
        console2.log("9. Run SetNewDescriptor.s.sol with NEW_DESCRIPTOR_ADDRESS=", address(newDescriptor));
    }
}
