// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {IAnonsToken} from "../src/interfaces/IAnonsToken.sol";
import {IAnonsDescriptor} from "../src/interfaces/IAnonsDescriptor.sol";

/// @title SetNewDescriptor
/// @notice Updates the AnonsToken to point to the new descriptor
contract SetNewDescriptor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        address newDescriptorAddress = vm.envAddress("NEW_DESCRIPTOR_ADDRESS");

        IAnonsToken token = IAnonsToken(tokenAddress);
        IAnonsDescriptor newDescriptor = IAnonsDescriptor(newDescriptorAddress);

        console2.log("=== Setting New Descriptor ===");
        console2.log("Token:", tokenAddress);
        console2.log("Current Descriptor:", address(token.descriptor()));
        console2.log("New Descriptor:", newDescriptorAddress);
        console2.log("");

        // Verify the new descriptor is properly configured
        console2.log("Verifying new descriptor...");
        uint256 headCount = newDescriptor.headCount(false);
        uint256 bodyCount = newDescriptor.bodyCount(false);
        uint256 specsCount = newDescriptor.visorCount(false);
        
        console2.log("  Head count:", headCount);
        console2.log("  Body count:", bodyCount);
        console2.log("  Specs count:", specsCount);
        console2.log("");

        if (headCount == 0 || bodyCount == 0 || specsCount == 0) {
            console2.log("ERROR: New descriptor is not fully configured!");
            console2.log("Make sure all traits are uploaded before setting the descriptor.");
            revert("Descriptor not configured");
        }

        vm.startBroadcast(deployerPrivateKey);

        console2.log("Updating token contract...");
        token.setDescriptor(newDescriptor);
        console2.log("  >> Descriptor updated successfully!");

        vm.stopBroadcast();

        console2.log("");
        console2.log("=== Update Complete ===");
        console2.log("The token contract now uses the new descriptor.");
        console2.log("All Anons (including #0) will now render with:");
        console2.log("  - Fixed specs colors/gradients");
        console2.log("  - Human-readable trait names");
    }
}
