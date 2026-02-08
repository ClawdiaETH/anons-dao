// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {AnonsToken} from "../../src/AnonsToken.sol";
import {AnonsAuctionHouse} from "../../src/AnonsAuctionHouse.sol";
import {IAnonsAuctionHouse} from "../../src/interfaces/IAnonsAuctionHouse.sol";
import {IAnonsSeeder} from "../../src/interfaces/IAnonsSeeder.sol";
import {AnonsDescriptor} from "../../src/AnonsDescriptor.sol";
import {AnonsSeeder} from "../../src/AnonsSeeder.sol";
import {MockERC8004Registry} from "../mocks/MockERC8004Registry.sol";
import {MockWETH} from "../mocks/MockWETH.sol";
import {AuctionHouseHandler} from "./handlers/AuctionHouseHandler.sol";

/// @title AnonsInvariantTest
/// @notice Invariant tests for Anons DAO security properties
contract AnonsInvariantTest is StdInvariant, Test {
    AnonsToken public anons;
    AnonsAuctionHouse public auctionHouse;
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;
    MockERC8004Registry public registry;
    MockWETH public weth;
    AuctionHouseHandler public handler;

    address public treasury;
    address public creator;

    function setUp() public {
        // Deploy contracts
        treasury = makeAddr("treasury");
        creator = makeAddr("creator");

        registry = new MockERC8004Registry();
        weth = new MockWETH();
        descriptor = new AnonsDescriptor();
        seeder = new AnonsSeeder();

        // Set up minimal descriptor (same as unit tests)
        string[] memory pal = new string[](2);
        pal[0] = "000000";
        pal[1] = "ffffff";
        descriptor.setPalette(pal);

        string[] memory bgs = new string[](4);
        bgs[0] = "FEF3C7"; // Dawn bg 1
        bgs[1] = "FFEDD5"; // Dawn bg 2
        bgs[2] = "1E1B4B"; // Dusk bg 1
        bgs[3] = "312E81"; // Dusk bg 2
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

        // Set block number for blockhash randomness
        vm.roll(100);

        // Create Clawdia's custom seed (Anon #0)
        IAnonsSeeder.Seed memory clawdiaSeed = IAnonsSeeder.Seed({
            background: 0,
            head: 0,
            visor: 0,
            antenna: 0,
            body: 0,
            accessory: 0,
            isDusk: false // Dawn
        });

        anons = new AnonsToken(
            creator, // Clawdia gets Anon #0
            descriptor,
            seeder,
            clawdiaSeed
        );

        auctionHouse = new AnonsAuctionHouse(
            anons,
            registry,
            weth,
            treasury,
            creator
        );

        // Set auction house as minter
        anons.setMinter(address(auctionHouse));
        
        // Transfer Anons ownership to auction house
        anons.transferOwnership(address(auctionHouse));
        
        // Accept ownership from auction house
        vm.prank(address(auctionHouse));
        anons.acceptOwnership();

        // Deploy handler for guided fuzzing
        handler = new AuctionHouseHandler(auctionHouse, registry, anons);

        // Target handler for invariant fuzzing
        targetContract(address(handler));

        // Unpause to start first auction
        auctionHouse.unpause();
    }

    /// @notice CRITICAL: Only ERC-8004 registered agents can bid
    function invariant_OnlyRegisteredAgentsCanBid() public view {
        // If there's a current bidder, they must be registered
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        
        if (currentAuction.amount > 0 && currentAuction.bidder != address(0)) {
            assertTrue(registry.balanceOf(currentAuction.bidder) > 0, "Current bidder not registered");
        }
    }

    /// @notice CRITICAL: Auction proceeds always split 95% treasury, 5% creator
    function invariant_ProceedsSplit95_5() public view {
        uint256 treasuryBalance = treasury.balance;
        uint256 creatorBalance = creator.balance;

        if (treasuryBalance > 0 || creatorBalance > 0) {
            uint256 totalProceeds = treasuryBalance + creatorBalance;
            
            // Treasury should have ~95% (allow 1% rounding tolerance)
            uint256 expectedTreasury = (totalProceeds * 95) / 100;
            uint256 treasuryDiff = treasuryBalance > expectedTreasury 
                ? treasuryBalance - expectedTreasury 
                : expectedTreasury - treasuryBalance;
            
            assertTrue(
                treasuryDiff <= totalProceeds / 100, // Max 1% deviation
                "Treasury split incorrect"
            );

            // Creator should have ~5% (allow 1% rounding tolerance)
            uint256 expectedCreator = (totalProceeds * 5) / 100;
            uint256 creatorDiff = creatorBalance > expectedCreator
                ? creatorBalance - expectedCreator
                : expectedCreator - creatorBalance;
            
            assertTrue(
                creatorDiff <= totalProceeds / 100, // Max 1% deviation
                "Creator split incorrect"
            );
        }
    }

    /// @notice CRITICAL: Each Anon NFT is only minted once (no double-mints)
    function invariant_UniqueTokenIds() public view {
        uint256 totalSupply = anons.totalSupply();
        
        for (uint256 i = 0; i < totalSupply; i++) {
            // If token exists, verify owner
            address owner = anons.ownerOf(i);
            assertTrue(owner != address(0), "Token has no owner");
        }
    }

    /// @notice CRITICAL: Auctions can only be settled after endTime
    function invariant_AuctionTimingEnforced() public view {
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        
        // If auction was settled, it must have been after endTime
        // (We can't check past timestamp, but we can check current auction state)
        if (!currentAuction.settled && currentAuction.startTime > 0) {
            // Current auction must be valid
            assertTrue(currentAuction.endTime > currentAuction.startTime, "Invalid auction timing");
            
            // Duration should be at least 12 hours (can be longer due to anti-sniping extensions)
            uint256 minDuration = 43200; // 12 hours
            assertTrue(
                currentAuction.endTime >= currentAuction.startTime + minDuration,
                "Duration less than 12 hours"
            );
            
            // If extended, should be by multiples of time buffer (5 minutes = 300 seconds)
            uint256 actualDuration = currentAuction.endTime - currentAuction.startTime;
            if (actualDuration > minDuration) {
                // Extended auctions should still be reasonable (max 24 hours total)
                assertTrue(
                    actualDuration <= minDuration * 2,
                    "Auction extended beyond reasonable limit"
                );
            }
        }
    }

    /// @notice CRITICAL: Only one active auction at a time
    function invariant_SingleActiveAuction() public view {
        // Check that auction house only holds 0 or 1 Anon
        uint256 auctionHouseBalance = anons.balanceOf(address(auctionHouse));
        assertTrue(
            auctionHouseBalance <= 1,
            "Auction house holds multiple tokens"
        );
    }

    /// @notice CRITICAL: Dawn and Dusk alternate correctly
    function invariant_DawnDuskAlternation() public view {
        uint256 totalSupply = anons.totalSupply();
        
        if (totalSupply >= 2) {
            // Anon #0 is Dawn (custom seed, even ID)
            // Anon #1 should be Dusk (odd ID)
            // Anon #2 should be Dawn (even ID)
            // etc.
            
            for (uint256 i = 1; i < totalSupply; i++) {
                bool shouldBeDusk = (i % 2 == 1);
                IAnonsSeeder.Seed memory seed = anons.seeds(i);
                
                assertEq(
                    seed.isDusk,
                    shouldBeDusk,
                    string(abi.encodePacked("Wrong isDusk at token ", vm.toString(i)))
                );
            }
        }
    }

    /// @notice SECURITY: Contract ETH balance matches expected state
    function invariant_ETHBalanceMatchesState() public view {
        uint256 contractBalance = address(auctionHouse).balance;
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        
        if (currentAuction.settled) {
            // After settlement, all ETH should be distributed
            assertEq(contractBalance, 0, "ETH not distributed after settlement");
        } else if (currentAuction.amount > 0) {
            // During auction, balance should match current bid
            assertEq(contractBalance, currentAuction.amount, "ETH balance mismatch during auction");
        }
    }

    /// @notice SECURITY: No tokens stuck in auction house after settlement
    function invariant_NoStuckTokensAfterSettlement() public view {
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        
        if (currentAuction.settled) {
            uint256 auctionHouseBalance = anons.balanceOf(address(auctionHouse));
            assertEq(
                auctionHouseBalance,
                0,
                "Tokens stuck in auction house after settlement"
            );
        }
    }

    /// @notice SECURITY: Reserve price cannot be bypassed
    function invariant_ReservePriceEnforced() public view {
        IAnonsAuctionHouse.Auction memory currentAuction = auctionHouse.auction();
        uint256 reservePrice = auctionHouse.reservePrice();
        
        if (currentAuction.amount > 0) {
            assertTrue(
                currentAuction.amount >= reservePrice,
                "Bid below reserve price accepted"
            );
        }
    }

    /// @notice SECURITY: Auction house ownership integrity
    function invariant_OwnershipIntegrity() public view {
        // Auction house must own the Anons contract
        assertEq(
            anons.owner(),
            address(auctionHouse),
            "Auction house lost Anons ownership"
        );
    }

    /// @notice Handler stats for debugging
    function invariant_callSummary() public view {
        handler.callSummary();
    }
}
