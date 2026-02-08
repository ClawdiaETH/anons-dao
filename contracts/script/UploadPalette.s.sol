// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

contract UploadPalette is Script {
    function run() public {
        AnonsDescriptor descriptor = AnonsDescriptor(0xc45F4894F769602E1FDc888c935B294188a98064);
        
        vm.startBroadcast();
        
        console2.log("Loading palette...");
        string[] memory palette = TraitData.getPalette();
        console2.log("Palette size:", palette.length, "colors");
        
        console2.log("Uploading palette to descriptor...");
        descriptor.setPalette(palette);
        console2.log("Palette uploaded successfully");
        
        vm.stopBroadcast();
        
        console2.log("\nVerification:");
        console2.log("  Checking first color:", descriptor.palette(0));
        console2.log("  Checking last color:", descriptor.palette(palette.length - 1));
        console2.log("\nPalette upload complete! Anon NFTs should now render correctly.");
    }
}
