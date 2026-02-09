// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {MockERC8004Registry} from "../test/mocks/MockERC8004Registry.sol";

/// @title DeployRegistry
/// @notice Deploy MockERC8004Registry to mainnet for Anons DAO
contract DeployRegistry is Script {
    function run() external {
        address clawdia = 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9;
        
        console.log("Deploying MockERC8004Registry to Base mainnet");
        
        vm.startBroadcast();
        
        MockERC8004Registry registry = new MockERC8004Registry();
        console.log("MockERC8004Registry deployed:", address(registry));
        
        // Register Clawdia immediately
        registry.registerAgent(clawdia);
        console.log("Clawdia registered:", clawdia);
        
        vm.stopBroadcast();
    }
}
