// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import {AnonsDAO} from "../src/AnonsDAO.sol";
import {AnonsAuctionHouse} from "../src/AnonsAuctionHouse.sol";
import {AnonsToken} from "../src/AnonsToken.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {IWETH} from "../src/interfaces/IWETH.sol";

contract DeployRemaining is Script {
    // Base Sepolia WETH address
    address constant WETH = 0x4200000000000000000000000000000000000006;
    
    function run() external {
        // Load from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address clawdia = vm.envAddress("CLAWDIA_ADDRESS");
        
        // Already deployed contracts
        AnonsToken token = AnonsToken(0x46349fac5EbecE5C2bdA398a327FCa4ed7201119);
        IERC8004Registry registry = IERC8004Registry(0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy TimelockController
        // minDelay: 43200 seconds (12 hours)
        // proposers: empty array (will be set to DAO after deployment)
        // executors: address(0) means anyone can execute after delay
        // admin: clawdia (can grant roles initially, should renounce after setup)
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0);
        
        TimelockController timelock = new TimelockController(
            43200,      // 12 hour delay
            proposers,  // empty initially
            executors,  // anyone can execute
            clawdia     // admin
        );
        console.log("TimelockController deployed:", address(timelock));
        
        // 2. Deploy AnonsDAO
        AnonsDAO dao = new AnonsDAO(
            token,
            registry,
            timelock,
            clawdia
        );
        console.log("AnonsDAO deployed:", address(dao));
        
        // 3. Deploy AnonsAuctionHouse
        AnonsAuctionHouse auction = new AnonsAuctionHouse(
            token,
            registry,
            IWETH(WETH),
            address(timelock),
            clawdia
        );
        console.log("AnonsAuctionHouse deployed:", address(auction));
        
        // 4. Configure permissions
        
        // Grant PROPOSER_ROLE to DAO
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        timelock.grantRole(proposerRole, address(dao));
        console.log("Granted PROPOSER_ROLE to DAO");
        
        // Grant CANCELLER_ROLE to DAO
        bytes32 cancellerRole = timelock.CANCELLER_ROLE();
        timelock.grantRole(cancellerRole, address(dao));
        console.log("Granted CANCELLER_ROLE to DAO");
        
        // Set minter on AnonsToken to AuctionHouse
        token.setMinter(address(auction));
        console.log("Set AuctionHouse as minter on AnonsToken");
        
        vm.stopBroadcast();
        
        // Log all addresses
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("TimelockController:", address(timelock));
        console.log("AnonsDAO:", address(dao));
        console.log("AnonsAuctionHouse:", address(auction));
        console.log("========================\n");
    }
}
