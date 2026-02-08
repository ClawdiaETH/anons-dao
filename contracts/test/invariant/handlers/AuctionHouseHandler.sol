// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {AnonsAuctionHouse} from "../../../src/AnonsAuctionHouse.sol";
import {IAnonsAuctionHouse} from "../../../src/interfaces/IAnonsAuctionHouse.sol";
import {AnonsToken} from "../../../src/AnonsToken.sol";
import {MockERC8004Registry} from "../../mocks/MockERC8004Registry.sol";

/// @title AuctionHouseHandler
/// @notice Guided fuzzing handler for auction house invariant tests
contract AuctionHouseHandler is Test {
    AnonsAuctionHouse public auctionHouse;
    MockERC8004Registry public registry;
    AnonsToken public anons;

    // Track agent addresses for fuzzing
    address[] public agents;
    uint256 public constant MAX_AGENTS = 20;

    // Call tracking for debugging
    uint256 public calls_createBid;
    uint256 public calls_settleAuction;
    uint256 public calls_warpTime;
    uint256 public calls_registerAgent;

    constructor(
        AnonsAuctionHouse _auctionHouse,
        MockERC8004Registry _registry,
        AnonsToken _anons
    ) {
        auctionHouse = _auctionHouse;
        registry = _registry;
        anons = _anons;

        // Pre-create some registered agents
        for (uint256 i = 0; i < 5; i++) {
            address agent = makeAddr(string(abi.encodePacked("agent", vm.toString(i))));
            registry.registerAgent(agent);
            agents.push(agent);
            
            // Give them ETH for bidding
            vm.deal(agent, 100 ether);
        }
    }

    /// @notice Register a new agent (bounded to prevent overflow)
    function registerAgent(uint256 seed) public {
        calls_registerAgent++;

        if (agents.length >= MAX_AGENTS) return;

        address agent = makeAddr(string(abi.encodePacked("fuzz_agent", vm.toString(seed))));
        
        // Don't re-register
        bool isRegistered = registry.balanceOf(agent) > 0;
        if (isRegistered) return;

        registry.registerAgent(agent);
        agents.push(agent);
        vm.deal(agent, 100 ether);
    }

    /// @notice Create a bid from a random registered agent
    function createBid(uint256 agentIndex, uint256 bidAmount) public {
        calls_createBid++;

        // Bound inputs
        if (agents.length == 0) return;
        agentIndex = bound(agentIndex, 0, agents.length - 1);
        
        address agent = agents[agentIndex];
        
        // Get current auction state
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();

        // Check if auction is active
        if (block.timestamp < currentAuction.startTime || block.timestamp >= currentAuction.endTime) return;

        // Calculate minimum bid
        uint256 reservePrice = auctionHouse.reservePrice();
        uint256 minIncrement = auctionHouse.minBidIncrementPercentage();
        uint256 minBid = currentAuction.amount == 0 
            ? reservePrice 
            : currentAuction.amount + ((currentAuction.amount * minIncrement) / 100);

        // Bound bid to valid range (min bid to 10 ETH)
        bidAmount = bound(bidAmount, minBid, 10 ether);

        // Ensure agent has enough ETH
        if (agent.balance < bidAmount) {
            vm.deal(agent, bidAmount);
        }

        // Place bid
        vm.prank(agent);
        try auctionHouse.createBid{value: bidAmount}(currentAuction.anonId) {
            // Bid succeeded
        } catch {
            // Bid failed (expected in some cases)
        }
    }

    /// @notice Warp time forward (bounded to prevent huge jumps)
    function warpTime(uint256 seconds_) public {
        calls_warpTime++;

        // Bound time warp to 0-24 hours
        seconds_ = bound(seconds_, 0, 86400);
        
        vm.warp(block.timestamp + seconds_);
    }

    /// @notice Settle current auction and create new one
    function settleAuction() public {
        calls_settleAuction++;

        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();

        // Can only settle if auction ended and not already settled
        if (block.timestamp < currentAuction.endTime || currentAuction.settled) return;

        try auctionHouse.settleCurrentAndCreateNewAuction() {
            // Settlement succeeded
        } catch {
            // Settlement failed (might be paused)
        }
    }

    /// @notice Settle and warp in one action (common pattern)
    function settleAndWarp(uint256 seconds_) public {
        settleAuction();
        warpTime(seconds_);
    }

    /// @notice Create multiple bids in sequence (stress test)
    function createMultipleBids(
        uint256 agent1,
        uint256 bid1,
        uint256 agent2,
        uint256 bid2,
        uint256 agent3,
        uint256 bid3
    ) public {
        createBid(agent1, bid1);
        createBid(agent2, bid2);
        createBid(agent3, bid3);
    }

    /// @notice Full auction lifecycle: warp to end, settle, bid on new
    function completeAuctionCycle(
        uint256 agentIndex,
        uint256 bidAmount
    ) public {
        // Warp to end of current auction
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        if (block.timestamp < currentAuction.endTime) {
            vm.warp(currentAuction.endTime + 1);
        }

        // Settle
        settleAuction();

        // Warp a bit into new auction
        warpTime(60);

        // Bid
        createBid(agentIndex, bidAmount);
    }

    /// @notice Ghost variable: total ETH that should be in system
    function ghost_totalSystemETH() public view returns (uint256) {
        return address(auctionHouse).balance +
               payable(auctionHouse.treasury()).balance +
               payable(auctionHouse.creator()).balance;
    }

    /// @notice Print call summary for debugging
    function callSummary() external view {
        console.log("=== Call Summary ===");
        console.log("createBid calls:", calls_createBid);
        console.log("settleAuction calls:", calls_settleAuction);
        console.log("warpTime calls:", calls_warpTime);
        console.log("registerAgent calls:", calls_registerAgent);
        console.log("Total agents:", agents.length);
        console.log("Anons minted:", anons.totalSupply());
    }
}
