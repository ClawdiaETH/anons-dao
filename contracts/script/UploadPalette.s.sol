// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

contract UploadPalette is Script {
    function run() public {
        AnonsDescriptor descriptor = AnonsDescriptor(0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF);
        
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        
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
