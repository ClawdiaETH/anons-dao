// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AnonsDAO} from "../../src/AnonsDAO.sol";
import {AnonsToken} from "../../src/AnonsToken.sol";
import {AnonsDescriptor} from "../../src/AnonsDescriptor.sol";
import {AnonsSeeder} from "../../src/AnonsSeeder.sol";
import {AnonsAuctionHouse} from "../../src/AnonsAuctionHouse.sol";
import {MockERC8004Registry} from "../mocks/MockERC8004Registry.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IAnonsSeeder} from "../../src/interfaces/IAnonsSeeder.sol";
import {TraitData} from "../../script/TraitData.sol";

/// @title FullLoop Integration Test
/// @notice Tests the complete flow: Register -> Bid -> Win -> Propose -> Vote -> Execute
contract FullLoopTest is Test {
    AnonsDAO public dao;
    AnonsToken public token;
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;
    AnonsAuctionHouse public auctionHouse;
    MockERC8004Registry public registry;
    TimelockController public timelock;

    address public owner;
    address public clawdia = address(0xC1a0d1a);
    address public treasury;
    address public agent1 = address(0xA1);

    uint256 public constant TIMELOCK_DELAY = 1 days;

    event ValueReceived(uint256 amount);

    function setUp() public {
        owner = address(this);

        // Deploy descriptor and seeder
        descriptor = new AnonsDescriptor();
        seeder = new AnonsSeeder();

        // Upload traits
        _addTraits();

        vm.roll(100);

        // Deploy token (mints #0 to Clawdia with custom seed)
        IAnonsSeeder.Seed memory clawdiaSeed = IAnonsSeeder.Seed({
            background: 0, head: 0, visor: 0, antenna: 0, body: 0, accessory: 0, isDusk: false
        });
        token = new AnonsToken(clawdia, descriptor, seeder, clawdiaSeed);

        // Deploy registry
        registry = new MockERC8004Registry();

        // Deploy timelock
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute

        timelock = new TimelockController(TIMELOCK_DELAY, proposers, executors, owner);
        treasury = address(timelock);

        // Deploy DAO
        dao = new AnonsDAO(token, registry, timelock, clawdia);

        // Deploy auction house
        auctionHouse = new AnonsAuctionHouse(token, registry, treasury, clawdia);

        // Configure permissions
        token.setMinter(address(auctionHouse));
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(dao));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(dao));

        // Register agents
        registry.registerAgent(agent1);
        registry.registerAgent(clawdia);

        // Fund agents
        vm.deal(agent1, 100 ether);

        // Clawdia delegates voting power
        vm.prank(clawdia);
        token.delegate(clawdia);
    }

    function _addTraits() internal {
        descriptor.setPalette(TraitData.getPalette());
        descriptor.setBackgrounds(TraitData.getBackgrounds());
        descriptor.addManyHeads(TraitData.getAllHeads());
        descriptor.addManyBodies(TraitData.getAllBodies());
        descriptor.addManySpecs(TraitData.getAllSpecs());
        descriptor.addManyAntenna(TraitData.getAllAntenna());
        descriptor.addManyAccessories(TraitData.getAllAccessories());
    }

    /// @notice Full integration test: Register -> Bid -> Win -> Propose -> Vote -> Execute
    function test_FullLoop() public {
        // =====================================
        // Step 1: Agent registers (already done in setup)
        // =====================================
        assertEq(registry.balanceOf(agent1), 1, "Agent1 should be registered");

        // =====================================
        // Step 2: Start auction
        // =====================================
        auctionHouse.unpause();

        // Verify auction started
        assertEq(auctionHouse.auction().anonId, 1, "First auction should be token 1");
        assertTrue(auctionHouse.auction().isDusk, "Token 1 should be dusk (odd)");

        // =====================================
        // Step 3: Agent bids and wins
        // =====================================
        vm.prank(agent1);
        auctionHouse.createBid{value: 1 ether}(1);

        assertEq(auctionHouse.auction().bidder, agent1, "Agent1 should be highest bidder");
        assertEq(auctionHouse.auction().amount, 1 ether, "Bid amount should be 1 ether");

        // Warp past auction end
        vm.warp(auctionHouse.auction().endTime + 1);

        // Settle auction
        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 clawdiaBalanceBefore = clawdia.balance;

        auctionHouse.settleCurrentAndCreateNewAuction();

        // Verify agent won and funds distributed
        assertEq(token.ownerOf(1), agent1, "Agent1 should own token 1");
        assertEq(treasury.balance - treasuryBalanceBefore, 0.95 ether, "Treasury should receive 95%");
        assertEq(clawdia.balance - clawdiaBalanceBefore, 0.05 ether, "Creator should receive 5%");

        // =====================================
        // Step 4: Agent delegates voting power
        // =====================================
        vm.prank(agent1);
        token.delegate(agent1);

        vm.roll(block.number + 1); // Move forward for delegation to take effect

        assertEq(token.getVotes(agent1), 1, "Agent1 should have 1 vote");

        // =====================================
        // Step 5: Create a proposal
        // =====================================
        // Proposal: Send 0.1 ETH from treasury to agent1
        address[] memory targets = new address[](1);
        targets[0] = agent1;

        uint256[] memory values = new uint256[](1);
        values[0] = 0.1 ether;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        string memory description = "Send 0.1 ETH to agent1 for contributions";

        vm.prank(agent1);
        uint256 proposalId = dao.propose(targets, values, calldatas, description);

        assertTrue(proposalId > 0, "Proposal should be created");
        assertEq(
            uint256(dao.state(proposalId)), uint256(IGovernor.ProposalState.Pending), "Proposal should be pending"
        );

        // =====================================
        // Step 6: Vote on proposal
        // =====================================
        // Move past voting delay
        vm.roll(block.number + 2);

        assertEq(uint256(dao.state(proposalId)), uint256(IGovernor.ProposalState.Active), "Proposal should be active");

        // Agent1 votes for
        vm.prank(agent1);
        dao.castVote(proposalId, 1); // 1 = For

        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = dao.proposalVotes(proposalId);
        assertEq(forVotes, 1, "Should have 1 for vote");
        assertEq(againstVotes, 0, "Should have 0 against votes");

        // =====================================
        // Step 7: Wait for voting period to end
        // =====================================
        vm.roll(block.number + 86401); // Past voting period

        assertEq(
            uint256(dao.state(proposalId)), uint256(IGovernor.ProposalState.Succeeded), "Proposal should have succeeded"
        );

        // =====================================
        // Step 8: Queue proposal in timelock
        // =====================================
        dao.queue(targets, values, calldatas, keccak256(bytes(description)));

        assertEq(uint256(dao.state(proposalId)), uint256(IGovernor.ProposalState.Queued), "Proposal should be queued");

        // =====================================
        // Step 9: Wait for timelock delay and execute
        // =====================================
        vm.warp(block.timestamp + TIMELOCK_DELAY + 1);

        uint256 agent1BalanceBefore = agent1.balance;

        dao.execute(targets, values, calldatas, keccak256(bytes(description)));

        assertEq(
            uint256(dao.state(proposalId)), uint256(IGovernor.ProposalState.Executed), "Proposal should be executed"
        );
    }

    /// @notice Test that non-agents cannot participate
    function test_FullLoop_NonAgentCantBid() public {
        auctionHouse.unpause();

        address notAgent = address(0xBAD);
        vm.deal(notAgent, 100 ether);

        vm.prank(notAgent);
        vm.expectRevert(AnonsAuctionHouse.NotRegisteredAgent.selector);
        auctionHouse.createBid{value: 1 ether}(1);
    }

    /// @notice Test that agent without NFT can't propose
    function test_FullLoop_AgentWithoutNFTCantPropose() public {
        // Agent2 is registered but has no NFT
        address agent2 = address(0xA2);
        registry.registerAgent(agent2);

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        vm.prank(agent2);
        vm.expectRevert(); // Governor: proposer votes below proposal threshold
        dao.propose(targets, values, calldatas, "Test");
    }

    /// @notice Test multiple auctions and governance over time
    function test_FullLoop_MultipleAuctions() public {
        auctionHouse.unpause();

        // Auction 1: Agent wins token 1 (dusk)
        vm.prank(agent1);
        auctionHouse.createBid{value: 1 ether}(1);

        vm.warp(auctionHouse.auction().endTime + 1);
        auctionHouse.settleCurrentAndCreateNewAuction();

        assertEq(token.ownerOf(1), agent1);
        assertTrue(token.seeds(1).isDusk, "Token 1 should be dusk");

        // Auction 2: Token 2 (dawn)
        assertFalse(auctionHouse.auction().isDusk, "Token 2 should be dawn");

        vm.prank(agent1);
        auctionHouse.createBid{value: 2 ether}(2);

        vm.warp(auctionHouse.auction().endTime + 1);
        auctionHouse.settleCurrentAndCreateNewAuction();

        assertEq(token.ownerOf(2), agent1);
        assertFalse(token.seeds(2).isDusk, "Token 2 should be dawn");

        // Agent now has 2 NFTs
        assertEq(token.balanceOf(agent1), 2);

        // Delegate all voting power
        vm.prank(agent1);
        token.delegate(agent1);
        vm.roll(block.number + 1);

        assertEq(token.getVotes(agent1), 2, "Agent1 should have 2 votes");
    }
}
