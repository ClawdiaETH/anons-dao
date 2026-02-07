// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC8004Registry} from "../../src/interfaces/IERC8004Registry.sol";

/// @title MockERC8004Registry
/// @notice Mock implementation of ERC-8004 Agent Registry for testing
contract MockERC8004Registry is IERC8004Registry {
    mapping(address => bool) public registeredAgents;

    /// @notice Register an address as an agent
    function registerAgent(address agent) external {
        registeredAgents[agent] = true;
    }

    /// @notice Unregister an address as an agent
    function unregisterAgent(address agent) external {
        registeredAgents[agent] = false;
    }

    /// @inheritdoc IERC8004Registry
    function balanceOf(address owner) external view override returns (uint256) {
        return registeredAgents[owner] ? 1 : 0;
    }
}
