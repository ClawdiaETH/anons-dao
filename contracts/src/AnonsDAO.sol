// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IERC8004Registry} from "./interfaces/IERC8004Registry.sol";

/// @title AnonsDAO
/// @notice Governor contract for Anons DAO with dual-gating (Anon NFT + ERC-8004 registration)
contract AnonsDAO is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorTimelockControl {
    error NotRegisteredAgent();
    error VetoerOnly();
    error VetoAlreadyBurned();
    error ProposalNotActive();

    /// @notice Emitted when an agent casts a vote
    event VoteCastWithAgent(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight);

    /// @notice Emitted when the vetoer is updated
    event VetoerUpdated(address indexed oldVetoer, address indexed newVetoer);

    /// @notice Emitted when a proposal is vetoed
    event ProposalVetoed(uint256 indexed proposalId);

    /// @notice The ERC-8004 agent registry for dual-gating
    IERC8004Registry public immutable agentRegistry;

    /// @notice The vetoer address (Clawdia during bootstrap)
    address public vetoer;

    /// @notice Mapping of vetoed proposals
    mapping(uint256 => bool) private _vetoedProposals;

    /// @notice Voting delay: 1 block
    uint48 private constant VOTING_DELAY = 1;

    /// @notice Voting period: 48 hours (in blocks, ~2s per block on Base)
    uint32 private constant VOTING_PERIOD = 86400; // 48 hours / 2s = 86400 blocks

    /// @notice Proposal threshold: 1 Anon
    uint256 private constant PROPOSAL_THRESHOLD = 1;

    constructor(
        IVotes _token,
        IERC8004Registry _agentRegistry,
        TimelockController _timelock,
        address _vetoer
    )
        Governor("Anons DAO")
        GovernorSettings(VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD)
        GovernorVotes(_token)
        GovernorTimelockControl(_timelock)
    {
        agentRegistry = _agentRegistry;
        vetoer = _vetoer;
    }

    /// @notice Modifier to check if caller is a registered agent
    modifier onlyRegisteredAgent() {
        if (agentRegistry.balanceOf(msg.sender) == 0) revert NotRegisteredAgent();
        _;
    }

    /// @notice Override propose to enforce dual-gating
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) onlyRegisteredAgent returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    /// @notice Override castVote to enforce dual-gating and emit agent event
    function castVote(uint256 proposalId, uint8 support)
        public
        override(Governor)
        onlyRegisteredAgent
        returns (uint256)
    {
        uint256 weight = super.castVote(proposalId, support);
        emit VoteCastWithAgent(msg.sender, proposalId, support, weight);
        return weight;
    }

    /// @notice Override castVoteWithReason to enforce dual-gating
    function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason)
        public
        override(Governor)
        onlyRegisteredAgent
        returns (uint256)
    {
        uint256 weight = super.castVoteWithReason(proposalId, support, reason);
        emit VoteCastWithAgent(msg.sender, proposalId, support, weight);
        return weight;
    }

    /// @notice Override castVoteWithReasonAndParams to enforce dual-gating
    function castVoteWithReasonAndParams(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes memory params
    ) public override(Governor) onlyRegisteredAgent returns (uint256) {
        uint256 weight = super.castVoteWithReasonAndParams(proposalId, support, reason, params);
        emit VoteCastWithAgent(msg.sender, proposalId, support, weight);
        return weight;
    }

    /// @notice Override castVoteBySig to enforce dual-gating
    function castVoteBySig(uint256 proposalId, uint8 support, address voter, bytes memory signature)
        public
        override(Governor)
        returns (uint256)
    {
        if (agentRegistry.balanceOf(voter) == 0) revert NotRegisteredAgent();
        uint256 weight = super.castVoteBySig(proposalId, support, voter, signature);
        emit VoteCastWithAgent(voter, proposalId, support, weight);
        return weight;
    }

    /// @notice Veto a proposal (only during bootstrap period)
    /// @dev Can veto Active, Pending, or Queued proposals
    function veto(uint256 proposalId) external {
        if (msg.sender != vetoer) revert VetoerOnly();
        if (vetoer == address(0)) revert VetoAlreadyBurned();

        ProposalState status = state(proposalId);
        if (
            status == ProposalState.Canceled || status == ProposalState.Defeated || status == ProposalState.Executed
        ) {
            revert ProposalNotActive();
        }

        // Mark as vetoed - state() will return Canceled for vetoed proposals
        _vetoedProposals[proposalId] = true;

        // If proposal is already queued in timelock, also cancel it there
        if (status == ProposalState.Queued) {
            _cancel(
                _getProposalTargets(proposalId),
                _getProposalValues(proposalId),
                _getProposalCalldatas(proposalId),
                keccak256(bytes(_getProposalDescription(proposalId)))
            );
        }

        emit ProposalVetoed(proposalId);
    }

    /// @notice Set a new vetoer (can only be called by current vetoer)
    function setVetoer(address newVetoer) external {
        if (msg.sender != vetoer) revert VetoerOnly();
        address oldVetoer = vetoer;
        vetoer = newVetoer;
        emit VetoerUpdated(oldVetoer, newVetoer);
    }

    /// @notice Burn the veto power permanently (sets vetoer to address(0))
    function burnVetoPower() external {
        if (msg.sender != vetoer) revert VetoerOnly();
        address oldVetoer = vetoer;
        vetoer = address(0);
        emit VetoerUpdated(oldVetoer, address(0));
    }

    // Storage helpers for veto functionality
    mapping(uint256 => address[]) private _proposalTargets;
    mapping(uint256 => uint256[]) private _proposalValues;
    mapping(uint256 => bytes[]) private _proposalCalldatas;
    mapping(uint256 => string) private _proposalDescriptions;

    function _getProposalTargets(uint256 proposalId) internal view returns (address[] memory) {
        return _proposalTargets[proposalId];
    }

    function _getProposalValues(uint256 proposalId) internal view returns (uint256[] memory) {
        return _proposalValues[proposalId];
    }

    function _getProposalCalldatas(uint256 proposalId) internal view returns (bytes[] memory) {
        return _proposalCalldatas[proposalId];
    }

    function _getProposalDescription(uint256 proposalId) internal view returns (string memory) {
        return _proposalDescriptions[proposalId];
    }

    /// @notice Store proposal data for veto functionality
    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal override returns (uint256) {
        uint256 proposalId = super._propose(targets, values, calldatas, description, proposer);

        _proposalTargets[proposalId] = targets;
        _proposalValues[proposalId] = values;
        _proposalCalldatas[proposalId] = calldatas;
        _proposalDescriptions[proposalId] = description;

        return proposalId;
    }

    // Required overrides for multiple inheritance

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override returns (uint256) {
        // Dynamic quorum: max(10% of supply, 3 votes) to balance early participation with security
        uint256 totalSupply = IVotes(address(token())).getPastTotalSupply(blockNumber);
        uint256 tenPercentQuorum = (totalSupply * 10) / 100;
        
        // Ensure minimum of 3 votes even with low supply, but use 10% when supply grows
        return tenPercentQuorum > 3 ? tenPercentQuorum : 3;
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        // Check if proposal has been vetoed first
        if (_vetoedProposals[proposalId]) {
            return ProposalState.Canceled;
        }
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
