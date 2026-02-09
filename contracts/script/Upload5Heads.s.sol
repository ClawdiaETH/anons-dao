// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

contract Upload5Heads is Script {
    function run() public {
        AnonsDescriptor descriptor = AnonsDescriptor(0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF);
        
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        
        console2.log("Loading heads...");
        bytes[] memory allHeads = TraitData.getAllHeads();
        console2.log("Head count:", allHeads.length);
        
        // Upload in batches of 5 (heads are large)
        uint256 batchSize = 5;
        for (uint256 i = 0; i < allHeads.length; i += batchSize) {
            uint256 remaining = allHeads.length - i;
            uint256 currentBatchSize = remaining < batchSize ? remaining : batchSize;
            
            bytes[] memory batch = new bytes[](currentBatchSize);
            for (uint256 j = 0; j < currentBatchSize; j++) {
                batch[j] = allHeads[i + j];
            }
            
            console2.log("Uploading batch", i / batchSize + 1, "/", (allHeads.length + batchSize - 1) / batchSize);
            descriptor.addManyHeads(batch);
        }
        
        console2.log("All heads uploaded");
        
        vm.stopBroadcast();
        
        console2.log("Verification:");
        console2.log("  headCount:", descriptor.headCount(false));
    }
}
