// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

contract Upload6Accessories is Script {
    function run() public {
        AnonsDescriptor descriptor = AnonsDescriptor(0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8);
        
        vm.startBroadcast();
        
        console2.log("Loading accessories...");
        bytes[] memory allAccessories = TraitData.getAllAccessories();
        console2.log("Accessory count:", allAccessories.length);
        
        // Upload in batches of 5 (accessories are large)
        uint256 batchSize = 5;
        for (uint256 i = 0; i < allAccessories.length; i += batchSize) {
            uint256 remaining = allAccessories.length - i;
            uint256 currentBatchSize = remaining < batchSize ? remaining : batchSize;
            
            bytes[] memory batch = new bytes[](currentBatchSize);
            for (uint256 j = 0; j < currentBatchSize; j++) {
                batch[j] = allAccessories[i + j];
            }
            
            console2.log("Uploading batch", i / batchSize + 1, "/", (allAccessories.length + batchSize - 1) / batchSize);
            descriptor.addManyAccessories(batch);
        }
        
        console2.log("All accessories uploaded");
        
        vm.stopBroadcast();
        
        console2.log("Verification:");
        console2.log("  accessoryCount:", descriptor.accessoryCount(false));
    }
}
