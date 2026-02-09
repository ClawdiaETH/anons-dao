// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

contract Upload4Antenna is Script {
    function run() public {
        AnonsDescriptor descriptor = AnonsDescriptor(0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF);
        
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        
        console2.log("Loading antenna...");
        bytes[] memory allAntenna = TraitData.getAllAntenna();
        console2.log("Antenna count:", allAntenna.length);
        
        // Upload in batches of 10
        uint256 batchSize = 10;
        for (uint256 i = 0; i < allAntenna.length; i += batchSize) {
            uint256 remaining = allAntenna.length - i;
            uint256 currentBatchSize = remaining < batchSize ? remaining : batchSize;
            
            bytes[] memory batch = new bytes[](currentBatchSize);
            for (uint256 j = 0; j < currentBatchSize; j++) {
                batch[j] = allAntenna[i + j];
            }
            
            console2.log("Uploading batch", i / batchSize + 1, "/", (allAntenna.length + batchSize - 1) / batchSize);
            descriptor.addManyAntenna(batch);
        }
        
        console2.log("All antenna uploaded");
        
        vm.stopBroadcast();
        
        console2.log("Verification:");
        console2.log("  antennaCount:", descriptor.antennaCount(false));
    }
}
