// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

/// @notice Upload all trait data to AnonsDescriptor in batches
/// @dev Run with: forge script script/UploadTraits.s.sol:UploadTraits --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --legacy
contract UploadTraits is Script {
    AnonsDescriptor public descriptor;
    
    uint256 constant BATCH_SIZE_SMALL = 10;  // For bodies, specs, antenna
    uint256 constant BATCH_SIZE_LARGE = 5;   // For heads, accessories
    
    function setUp() public {
        descriptor = AnonsDescriptor(0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF);
    }
    
    function run() public {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        
        // 1. Upload palette
        console2.log("1. Uploading palette...");
        string[] memory palette = TraitData.getPalette();
        try descriptor.palette(0) returns (string memory) {
            console2.log("   Palette already uploaded");
        } catch {
            descriptor.setPalette(palette);
            console2.log("   Palette uploaded:", palette.length, "colors");
        }
        
        // 2. Upload backgrounds
        console2.log("2. Uploading backgrounds...");
        string[] memory backgrounds = TraitData.getBackgrounds();
        descriptor.setBackgrounds(backgrounds);
        console2.log("   Backgrounds uploaded:", backgrounds.length);
        
        // 3. Upload bodies
        console2.log("3. Uploading bodies...");
        bytes[] memory allBodies = TraitData.getAllBodies();
        uploadInBatches("bodies", allBodies, BATCH_SIZE_SMALL);
        
        // 4. Upload specs
        console2.log("4. Uploading specs...");
        bytes[] memory allSpecs = TraitData.getAllSpecs();
        uploadInBatches("specs", allSpecs, BATCH_SIZE_SMALL);
        
        // 5. Upload antenna
        console2.log("5. Uploading antenna...");
        bytes[] memory allAntenna = TraitData.getAllAntenna();
        uploadInBatches("antenna", allAntenna, BATCH_SIZE_SMALL);
        
        // 6. Upload heads (large - smaller batches)
        console2.log("6. Uploading heads...");
        bytes[] memory allHeads = TraitData.getAllHeads();
        uploadInBatches("heads", allHeads, BATCH_SIZE_LARGE);
        
        // 7. Upload accessories (large - smaller batches)
        console2.log("7. Uploading accessories...");
        bytes[] memory allAccessories = TraitData.getAllAccessories();
        uploadInBatches("accessories", allAccessories, BATCH_SIZE_LARGE);
        
        vm.stopBroadcast();
        
        console2.log("\n=== Upload Complete ===");
        console2.log("Verifying counts...");
        console2.log("Backgrounds:", descriptor.backgroundCount(false));
        console2.log("Bodies:", descriptor.bodyCount(false));
        console2.log("Specs:", descriptor.visorCount(false));
        console2.log("Antenna:", descriptor.antennaCount(false));
        console2.log("Heads:", descriptor.headCount(false));
        console2.log("Accessories:", descriptor.accessoryCount(false));
    }
    
    function uploadInBatches(string memory traitType, bytes[] memory traits, uint256 batchSize) internal {
        uint256 totalBatches = (traits.length + batchSize - 1) / batchSize;
        
        for (uint256 i = 0; i < traits.length; i += batchSize) {
            uint256 batchNum = i / batchSize + 1;
            uint256 remaining = traits.length - i;
            uint256 currentBatchSize = remaining < batchSize ? remaining : batchSize;
            
            bytes[] memory batch = new bytes[](currentBatchSize);
            for (uint256 j = 0; j < currentBatchSize; j++) {
                batch[j] = traits[i + j];
            }
            
            console2.log("   Batch", batchNum, "/", totalBatches);
            console2.log("   Uploading", currentBatchSize, traitType);
            
            if (keccak256(bytes(traitType)) == keccak256("bodies")) {
                descriptor.addManyBodies(batch);
            } else if (keccak256(bytes(traitType)) == keccak256("specs")) {
                descriptor.addManySpecs(batch);
            } else if (keccak256(bytes(traitType)) == keccak256("antenna")) {
                descriptor.addManyAntenna(batch);
            } else if (keccak256(bytes(traitType)) == keccak256("heads")) {
                descriptor.addManyHeads(batch);
            } else if (keccak256(bytes(traitType)) == keccak256("accessories")) {
                descriptor.addManyAccessories(batch);
            }
        }
        
        console2.log("   Uploaded all", traits.length, traitType);
    }
}
