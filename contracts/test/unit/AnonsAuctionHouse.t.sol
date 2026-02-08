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

contract AnonsAuctionHouseTest is Test {
    AnonsAuctionHouse public auctionHouse;
    AnonsToken public token;
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;
    MockERC8004Registry public registry;
    MockWETH public weth;

    address public owner;
    address public clawdia = address(0xC1a0d1a);
    address public treasury = address(0x7ea50);
    address public agent1 = address(0xA1);
    address public agent2 = address(0xA2);
    address public notAgent = address(0xBAD);

    function setUp() public {
        owner = address(this);

        // Deploy contracts
        descriptor = new AnonsDescriptor();
        seeder = new AnonsSeeder();
        registry = new MockERC8004Registry();
        weth = new MockWETH();

        // Set up minimal descriptor
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

        // Set auction house as minter
        token.setMinter(address(auctionHouse));

        // Register agents
        registry.registerAgent(agent1);
        registry.registerAgent(agent2);

        // Fund agents
        vm.deal(agent1, 100 ether);
        vm.deal(agent2, 100 ether);
        vm.deal(notAgent, 100 ether);
    }

    function test_Constructor_StartsPaused() public {
        assertTrue(auctionHouse.paused());
    }

    function test_Unpause_StartsFirstAuction() public {
        auctionHouse.unpause();

        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        assertEq(auction.anonId, 1, "First auction should be token 1");
        assertEq(auction.amount, 0, "Starting amount should be 0");
        assertFalse(auction.settled, "Auction should not be settled");
        assertEq(auction.bidder, address(0), "No bidder yet");
    }

    function test_CreateBid_RegisteredAgentCanBid() public {
        auctionHouse.unpause();

        vm.prank(agent1);
        auctionHouse.createBid{value: 0.1 ether}(1);

        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        assertEq(auction.bidder, agent1);
        assertEq(auction.amount, 0.1 ether);
    }

    function test_CreateBid_RevertsIfNotRegisteredAgent() public {
        auctionHouse.unpause();

        vm.expectRevert(AnonsAuctionHouse.NotRegisteredAgent.selector);
        vm.prank(notAgent);
        auctionHouse.createBid{value: 0.1 ether}(1);
    }

    function test_CreateBid_RevertsIfBelowReserve() public {
        auctionHouse.unpause();

        vm.prank(agent1);
        vm.expectRevert(AnonsAuctionHouse.BidTooLow.selector);
        auctionHouse.createBid{value: 0.001 ether}(1); // Below 0.01 reserve
    }

    function test_CreateBid_RevertsIfBelowMinIncrement() public {
        auctionHouse.unpause();

        vm.prank(agent1);
        auctionHouse.createBid{value: 1 ether}(1);

        // Second bid must be at least 5% higher
        vm.prank(agent2);
        vm.expectRevert(AnonsAuctionHouse.BidTooLow.selector);
        auctionHouse.createBid{value: 1.04 ether}(1); // Only 4% higher
    }

    function test_CreateBid_RefundsPreviousBidder() public {
        auctionHouse.unpause();

        uint256 agent1BalanceBefore = agent1.balance;

        vm.prank(agent1);
        auctionHouse.createBid{value: 1 ether}(1);

        uint256 agent1BalanceAfterBid = agent1.balance;
        assertEq(agent1BalanceAfterBid, agent1BalanceBefore - 1 ether);

        // Agent2 outbids
        vm.prank(agent2);
        auctionHouse.createBid{value: 1.1 ether}(1);

        // Agent1 should be refunded
        assertEq(agent1.balance, agent1BalanceBefore, "Agent1 should be refunded");
    }

    function test_CreateBid_AntiSniping_ExtendAuction() public {
        auctionHouse.unpause();

        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        uint256 originalEndTime = auction.endTime;

        // Warp to 2 minutes before end (within 5 min buffer)
        vm.warp(auction.endTime - 120);

        vm.prank(agent1);
        auctionHouse.createBid{value: 0.1 ether}(1);

        auction = auctionHouse.auction();
        assertTrue(auction.endTime > originalEndTime, "Auction should be extended");
        assertEq(auction.endTime, block.timestamp + 300, "Should extend by timeBuffer");
    }

    function test_CreateBid_RevertsIfAuctionExpired() public {
        auctionHouse.unpause();

        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        vm.warp(auction.endTime + 1);

        vm.prank(agent1);
        vm.expectRevert(AnonsAuctionHouse.AuctionExpired.selector);
        auctionHouse.createBid{value: 0.1 ether}(1);
    }

    function test_CreateBid_RevertsIfWrongAnonId() public {
        auctionHouse.unpause();

        vm.prank(agent1);
        vm.expectRevert(AnonsAuctionHouse.InvalidAnonId.selector);
        auctionHouse.createBid{value: 0.1 ether}(999);
    }

    function test_SettleAuction_95_5_Split() public {
        auctionHouse.unpause();

        vm.prank(agent1);
        auctionHouse.createBid{value: 1 ether}(1);

        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        vm.warp(auction.endTime + 1);

        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 clawdiaBalanceBefore = clawdia.balance;

        auctionHouse.settleCurrentAndCreateNewAuction();

        assertEq(treasury.balance - treasuryBalanceBefore, 0.95 ether, "Treasury should get 95%");
        assertEq(clawdia.balance - clawdiaBalanceBefore, 0.05 ether, "Creator should get 5%");
    }

    function test_SettleAuction_TransfersTokenToWinner() public {
        auctionHouse.unpause();

        vm.prank(agent1);
        auctionHouse.createBid{value: 1 ether}(1);

        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        vm.warp(auction.endTime + 1);

        auctionHouse.settleCurrentAndCreateNewAuction();

        assertEq(token.ownerOf(1), agent1, "Winner should own the token");
    }

    function test_SettleAuction_NoBids_SendsToCreator() public {
        auctionHouse.unpause();

        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        vm.warp(auction.endTime + 1);

        auctionHouse.settleCurrentAndCreateNewAuction();

        // Token should be sent to creator (Clawdia)
        assertEq(token.ownerOf(1), clawdia, "Unbid token should go to creator");
    }

    function test_SettleAuction_StartsNewAuction() public {
        auctionHouse.unpause();

        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        vm.warp(auction.endTime + 1);

        auctionHouse.settleCurrentAndCreateNewAuction();

        auction = auctionHouse.auction();
        assertEq(auction.anonId, 2, "New auction should be for token 2");
        assertFalse(auction.settled, "New auction should not be settled");
    }

    function test_DawnDuskCycles_Alternate() public {
        auctionHouse.unpause();

        // Token 1 (odd) = dusk
        IAnonsAuctionHouse.Auction memory auction = auctionHouse.auction();
        assertTrue(auction.isDusk, "Token 1 should be dusk");

        vm.warp(auction.endTime + 1);
        auctionHouse.settleCurrentAndCreateNewAuction();

        // Token 2 (even) = dawn
        auction = auctionHouse.auction();
        assertFalse(auction.isDusk, "Token 2 should be dawn");

        vm.warp(auction.endTime + 1);
        auctionHouse.settleCurrentAndCreateNewAuction();

        // Token 3 (odd) = dusk
        auction = auctionHouse.auction();
        assertTrue(auction.isDusk, "Token 3 should be dusk");
    }

    function test_Duration_Is12Hours() public {
        assertEq(auctionHouse.duration(), 43200, "Default duration should be 12 hours");
    }

    function test_SetDuration_OnlyOwner() public {
        auctionHouse.setDuration(86400); // 24 hours
        assertEq(auctionHouse.duration(), 86400);
    }

    function test_SetReservePrice_OnlyOwner() public {
        auctionHouse.setReservePrice(0.1 ether);
        assertEq(auctionHouse.reservePrice(), 0.1 ether);
    }

    function test_SetTimeBuffer_OnlyOwner() public {
        auctionHouse.setTimeBuffer(600); // 10 minutes
        assertEq(auctionHouse.timeBuffer(), 600);
    }

    function test_Pause_OnlyOwner() public {
        auctionHouse.unpause();
        auctionHouse.pause();
        assertTrue(auctionHouse.paused());
    }

    function test_EmitAuctionBidEvent() public {
        auctionHouse.unpause();

        vm.prank(agent1);
        vm.expectEmit(true, true, false, true);
        emit IAnonsAuctionHouse.AuctionBid(1, agent1, 0.1 ether, false);
        auctionHouse.createBid{value: 0.1 ether}(1);
    }
}
