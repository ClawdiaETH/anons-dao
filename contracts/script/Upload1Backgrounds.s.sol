// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

contract Upload1Backgrounds is Script {
    function run() public {
        AnonsDescriptor descriptor = AnonsDescriptor(0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8);
        
        vm.startBroadcast();
        
        console2.log("Uploading backgrounds...");
        string[] memory backgrounds = TraitData.getBackgrounds();
        console2.log("Background count:", backgrounds.length);
        
        // This should already be done, but running again won't hurt
        descriptor.setBackgrounds(backgrounds);
        console2.log("Backgrounds uploaded");
        
        vm.stopBroadcast();
        
        console2.log("Verification:");
        console2.log("  backgroundCount:", descriptor.backgroundCount(false));
    }
}
