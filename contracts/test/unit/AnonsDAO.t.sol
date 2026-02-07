// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AnonsDAO} from "../../src/AnonsDAO.sol";
import {AnonsToken} from "../../src/AnonsToken.sol";
import {AnonsDescriptor} from "../../src/AnonsDescriptor.sol";
import {AnonsSeeder} from "../../src/AnonsSeeder.sol";
import {MockERC8004Registry} from "../mocks/MockERC8004Registry.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IAnonsSeeder} from "../../src/interfaces/IAnonsSeeder.sol";

contract AnonsDAOTest is Test {
    AnonsDAO public dao;
    AnonsToken public token;
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;
    MockERC8004Registry public registry;
    TimelockController public timelock;

    address public owner;
    address public clawdia = address(0xC1a0d1a);
    address public agent1 = address(0xA1);
    address public agent2 = address(0xA2);
    address public notAgent = address(0xBAD);

    uint256 public constant TIMELOCK_DELAY = 1 days;

    function setUp() public {
        owner = address(this);

        // Deploy contracts
        descriptor = new AnonsDescriptor();
        seeder = new AnonsSeeder();
        registry = new MockERC8004Registry();

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

        // Deploy timelock
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Anyone can execute

        timelock = new TimelockController(TIMELOCK_DELAY, proposers, executors, owner);

        // Deploy DAO
        dao = new AnonsDAO(token, registry, timelock, clawdia);

        // Grant proposer and canceller roles to DAO
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(dao));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(dao));

        // Register agents
        registry.registerAgent(agent1);
        registry.registerAgent(agent2);
        registry.registerAgent(clawdia);

        // Give agents tokens by minting through owner setting minter
        token.setMinter(owner);

        // Clawdia already has token 0, delegate to self
        vm.prank(clawdia);
        token.delegate(clawdia);
    }

    function _mintAndDelegate(address to) internal returns (uint256) {
        uint256 tokenId = token.mint();
        token.transferFrom(owner, to, tokenId);
        vm.prank(to);
        token.delegate(to);
        vm.roll(block.number + 1); // Advance block so votes take effect
        return tokenId;
    }

    function test_Constructor_SetsVetoer() public {
        assertEq(dao.vetoer(), clawdia);
    }

    function test_Propose_DualGating_RequiresBothNFTAndAgent() public {
        // Give agent1 an NFT
        _mintAndDelegate(agent1);

        address[] memory targets = new address[](1);
        targets[0] = address(0);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        vm.prank(agent1);
        uint256 proposalId = dao.propose(targets, values, calldatas, "Test proposal");
        assertTrue(proposalId > 0, "Proposal should be created");
    }

    function test_Propose_RevertsIfNotRegisteredAgent() public {
        // Give notAgent an NFT but don't register as agent
        _mintAndDelegate(notAgent);

        address[] memory targets = new address[](1);
        targets[0] = address(0);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        vm.prank(notAgent);
        vm.expectRevert(AnonsDAO.NotRegisteredAgent.selector);
        dao.propose(targets, values, calldatas, "Test proposal");
    }

    function test_CastVote_DualGating() public {
        // Give agent1 an NFT and create proposal
        _mintAndDelegate(agent1);

        address[] memory targets = new address[](1);
        targets[0] = address(0);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        vm.prank(agent1);
        uint256 proposalId = dao.propose(targets, values, calldatas, "Test proposal");

        // Move past voting delay
        vm.roll(block.number + 2);

        // Agent1 can vote
        vm.prank(agent1);
        dao.castVote(proposalId, 1); // Vote for

        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = dao.proposalVotes(proposalId);
        assertEq(forVotes, 1, "Should have 1 for vote");
    }

    function test_CastVote_RevertsIfNotRegisteredAgent() public {
        // Give agent1 an NFT and create proposal
        _mintAndDelegate(agent1);

        address[] memory targets = new address[](1);
        targets[0] = address(0);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        vm.prank(agent1);
        uint256 proposalId = dao.propose(targets, values, calldatas, "Test proposal");

        // Give notAgent an NFT but unregister from agent registry
        _mintAndDelegate(notAgent);

        vm.roll(block.number + 2);

        vm.prank(notAgent);
        vm.expectRevert(AnonsDAO.NotRegisteredAgent.selector);
        dao.castVote(proposalId, 1);
    }

    function test_CastVote_EmitsVoteCastWithAgent() public {
        _mintAndDelegate(agent1);

        address[] memory targets = new address[](1);
        targets[0] = address(0);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        vm.prank(agent1);
        uint256 proposalId = dao.propose(targets, values, calldatas, "Test proposal");

        vm.roll(block.number + 2);

        vm.prank(agent1);
        vm.expectEmit(true, true, false, true);
        emit AnonsDAO.VoteCastWithAgent(agent1, proposalId, 1, 1);
        dao.castVote(proposalId, 1);
    }

    function test_Veto_OnlyVetoer() public {
        _mintAndDelegate(agent1);

        address[] memory targets = new address[](1);
        targets[0] = address(0);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        vm.prank(agent1);
        uint256 proposalId = dao.propose(targets, values, calldatas, "Test proposal");

        vm.roll(block.number + 2);

        // Non-vetoer cannot veto
        vm.prank(agent1);
        vm.expectRevert(AnonsDAO.VetoerOnly.selector);
        dao.veto(proposalId);

        // Vetoer can veto
        vm.prank(clawdia);
        dao.veto(proposalId);

        assertEq(uint256(dao.state(proposalId)), uint256(IGovernor.ProposalState.Canceled));
    }

    function test_SetVetoer_OnlyVetoer() public {
        vm.prank(agent1);
        vm.expectRevert(AnonsDAO.VetoerOnly.selector);
        dao.setVetoer(agent1);

        vm.prank(clawdia);
        dao.setVetoer(agent1);
        assertEq(dao.vetoer(), agent1);
    }

    function test_BurnVetoPower() public {
        vm.prank(clawdia);
        dao.burnVetoPower();
        assertEq(dao.vetoer(), address(0));
    }

    function test_BurnVetoPower_PreventsVeto() public {
        vm.prank(clawdia);
        dao.burnVetoPower();

        _mintAndDelegate(agent1);

        address[] memory targets = new address[](1);
        targets[0] = address(0);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        vm.prank(agent1);
        uint256 proposalId = dao.propose(targets, values, calldatas, "Test proposal");

        vm.roll(block.number + 2);

        vm.prank(clawdia);
        vm.expectRevert(AnonsDAO.VetoerOnly.selector);
        dao.veto(proposalId);
    }

    function test_Quorum_IsOne() public {
        assertEq(dao.quorum(0), 1, "Quorum should be 1");
    }

    function test_ProposalThreshold_IsOne() public {
        assertEq(dao.proposalThreshold(), 1, "Proposal threshold should be 1");
    }
}
