// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AnonsDescriptor} from "../src/AnonsDescriptor.sol";
import {TraitData} from "./TraitData.sol";

contract Upload1Backgrounds is Script {
    function run() public {
        AnonsDescriptor descriptor = AnonsDescriptor(0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF);
        
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        
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
