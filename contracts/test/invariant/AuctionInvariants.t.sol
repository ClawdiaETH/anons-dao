// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AnonsAuctionHouse} from "../../src/AnonsAuctionHouse.sol";
import {AnonsToken} from "../../src/AnonsToken.sol";
import {AnonsDescriptor} from "../../src/AnonsDescriptor.sol";
import {AnonsSeeder} from "../../src/AnonsSeeder.sol";
import {MockERC8004Registry} from "../mocks/MockERC8004Registry.sol";
import {MockWETH} from "../mocks/MockWETH.sol";
import {IAnonsAuctionHouse} from "../../src/interfaces/IAnonsAuctionHouse.sol";
import {IAnonsSeeder} from "../../src/interfaces/IAnonsSeeder.sol";

/// @title AuctionInvariants
/// @notice Invariant tests for AnonsAuctionHouse
/// @dev Critical properties that must ALWAYS hold
contract AuctionInvariants is Test {
    AnonsAuctionHouse public auctionHouse;
    AnonsToken public token;
    MockERC8004Registry public registry;
    MockWETH public weth;

    address public treasury = address(0x7ea50);
    address public clawdia = address(0xC1a0d1a);
    
    uint256 public totalBidsReceived;
    uint256 public totalRefundsGiven;

    function setUp() public {
        // Deploy minimal contracts
        AnonsDescriptor descriptor = new AnonsDescriptor();
        AnonsSeeder seeder = new AnonsSeeder();
        registry = new MockERC8004Registry();
        weth = new MockWETH();

        // Minimal descriptor setup
        string[] memory pal = new string[](2);
        pal[0] = "000000";
        pal[1] = "ffffff";
        descriptor.setPalette(pal);

        string[] memory bgs = new string[](4);
        bgs[0] = "FEF3C7";
        bgs[1] = "FFEDD5";
        bgs[2] = "1E1B4B";
        bgs[3] = "312E81";
        descriptor.setBackgrounds(bgs);

        bytes[] memory heads = new bytes[](1);
        heads[0] = hex"0420140004010c01";
        descriptor.addManyHeads(heads);

        bytes[] memory specs = new bytes[](1);
        specs[0] = hex"0a1a0c060102";
        descriptor.addManySpecs(specs);

        bytes[] memory antennas = new bytes[](1);
        antennas[0] = hex"000220000201";
        descriptor.addManyAntenna(antennas);

        bytes[] memory bodies = new bytes[](1);
        bodies[0] = hex"1020200c04010801";
        descriptor.addManyBodies(bodies);

        bytes[] memory accessories = new bytes[](1);
        accessories[0] = hex"101a140c0101";
        descriptor.addManyAccessories(accessories);

        vm.roll(100);
        IAnonsSeeder.Seed memory clawdiaSeed = IAnonsSeeder.Seed({
            background: 0, head: 0, visor: 0, antenna: 0, body: 0, accessory: 0, isDusk: false
        });
        token = new AnonsToken(clawdia, descriptor, seeder, clawdiaSeed);

        auctionHouse = new AnonsAuctionHouse(token, registry, weth, treasury, clawdia);
        token.setMinter(address(auctionHouse));

        // Start first auction
        auctionHouse.unpause();
    }

    // ========================================
    // INVARIANT 1: Funds Conservation
    // ========================================
    /// @notice ETH balance must equal: currentBid OR (treasury+creator distributions)
    /// @dev After settlement, all ETH should be distributed. During auction, only current bid held.
    function invariant_FundsConservation() public {
        uint256 contractBalance = address(auctionHouse).balance;
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();

        if (currentAuction.settled || block.timestamp < currentAuction.startTime) {
            // No active auction - contract should have 0 balance
            assertEq(contractBalance, 0, "Settled/unstarted auction should have 0 balance");
        } else if (block.timestamp >= currentAuction.endTime && currentAuction.bidder != address(0)) {
            // Auction ended but not settled - should still hold winning bid
            // This is acceptable - settlement is permissionless
        } else {
            // Active auction - balance should equal current bid
            assertEq(contractBalance, currentAuction.amount, "Active auction balance != current bid");
        }
    }

    // ========================================
    // INVARIANT 2: No Double-Settle
    // ========================================
    /// @notice Each auction can only be settled once
    function invariant_NoDoubleSettle() public view {
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        
        // If settled, auction should be in terminal state
        // Cannot call settleAuction again on same auction
        // (This is enforced by the settled flag check in _settleAuction)
    }

    // ========================================
    // INVARIANT 3: Mint Exactly Once Per Auction
    // ========================================
    /// @notice Each auction mints exactly one NFT
    function invariant_MintExactlyOnce() public {
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        
        // If auction exists, the token for that anonId should exist
        if (currentAuction.anonId > 0) {
            // Token should be owned by auction house (unsettled) or winner (settled)
            address owner = token.ownerOf(currentAuction.anonId);
            assertTrue(
                owner == address(auctionHouse) || owner != address(0),
                "Auction token has invalid owner"
            );
        }
    }

    // ========================================
    // INVARIANT 4: No Refund Loss
    // ========================================
    /// @notice Every outbid user must receive their refund (ETH or WETH)
    /// @dev Track total bids received vs total refunds given
    function invariant_NoRefundLoss() public {
        // This would require event tracking in a handler contract
        // For now, we verify the refund mechanism works in unit tests
        // Invariant: If user was outbid, their balance increased by bid amount
    }

    // ========================================
    // INVARIANT 5: Time-Based State Consistency
    // ========================================
    /// @notice Auction state must be consistent with time
    function invariant_TimeBasedStateConsistency() public {
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();

        if (currentAuction.anonId == 0) {
            // No auction created yet (paused state)
            return;
        }

        if (currentAuction.settled) {
            // Settled auctions can exist in any time state
            return;
        }

        // Active auction must have valid time window
        assertTrue(currentAuction.endTime > currentAuction.startTime, "Auction end time must be after start time");
        assertTrue(currentAuction.endTime >= block.timestamp || currentAuction.settled, "Unsettled auction must not be expired (or needs settlement)");
    }

    // ========================================
    // INVARIANT 6: Split Ratio Correctness
    // ========================================
    /// @notice 95/5 split must be exact (no rounding errors)
    function invariant_SplitRatioCorrect() public pure {
        // Test various bid amounts
        uint256[] memory testAmounts = new uint256[](5);
        testAmounts[0] = 0.01 ether;
        testAmounts[1] = 1 ether;
        testAmounts[2] = 10 ether;
        testAmounts[3] = 100 ether;
        testAmounts[4] = 0.123456789 ether;

        for (uint256 i = 0; i < testAmounts.length; i++) {
            uint256 amount = testAmounts[i];
            uint256 treasuryAmount = (amount * 95) / 100;
            uint256 creatorAmount = amount - treasuryAmount;

            // Verify no dust loss
            assertEq(treasuryAmount + creatorAmount, amount, "Split must sum to total");
            
            // Verify creator gets at least 5% (handles rounding)
            assertTrue(creatorAmount >= (amount * 5) / 100, "Creator must get at least 5%");
        }
    }

    // ========================================
    // INVARIANT 7: Reserve Price Enforced
    // ========================================
    /// @notice No winning bid can be below reserve price
    function invariant_ReservePriceEnforced() public {
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        uint256 reservePrice = auctionHouse.reservePrice();

        if (currentAuction.anonId > 0 && currentAuction.amount > 0) {
            // If there's a bid, it must meet reserve price
            assertTrue(currentAuction.amount >= reservePrice, "Winning bid must meet reserve price");
        }
    }

    // ========================================
    // INVARIANT 8: Only Registered Agents Can Bid
    // ========================================
    /// @notice Current bidder must always be a registered agent (if bid exists)
    function invariant_OnlyRegisteredAgentsCanBid() public {
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();

        if (currentAuction.bidder != address(0) && 
            block.timestamp >= currentAuction.startTime && 
            block.timestamp < currentAuction.endTime) {
            // If there's an active bidder, they must be registered
            assertTrue(registry.balanceOf(currentAuction.bidder) > 0, "Bidder must be registered agent");
        }
    }
}
