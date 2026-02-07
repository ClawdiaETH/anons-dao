// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

contract Upload2Bodies is Script {
    function run() public {
        AnonsDescriptor descriptor = AnonsDescriptor(0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8);
        
        vm.startBroadcast();
        
        console2.log("Loading bodies...");
        bytes[] memory allBodies = TraitData.getAllBodies();
        console2.log("Body count:", allBodies.length);
        
        // Upload in batches of 5
        uint256 batchSize = 5;
        for (uint256 i = 0; i < allBodies.length; i += batchSize) {
            uint256 remaining = allBodies.length - i;
            uint256 currentBatchSize = remaining < batchSize ? remaining : batchSize;
            
            bytes[] memory batch = new bytes[](currentBatchSize);
            for (uint256 j = 0; j < currentBatchSize; j++) {
                batch[j] = allBodies[i + j];
            }
            
            console2.log("Uploading batch", i / batchSize + 1, "/", (allBodies.length + batchSize - 1) / batchSize);
            descriptor.addManyBodies(batch);
        }
        
        console2.log("All bodies uploaded");
        
        vm.stopBroadcast();
        
        console2.log("Verification:");
        console2.log("  bodyCount:", descriptor.bodyCount(false));
    }
}
