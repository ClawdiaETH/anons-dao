// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC8004Registry
/// @notice Minimal interface for ERC-8004 Agent Registry
/// @dev Used to check if an address is a registered AI agent
interface IERC8004Registry {
    /// @notice Returns the number of agent tokens owned by an address
    /// @param owner The address to check
    /// @return The number of agent tokens owned
    function balanceOf(address owner) external view returns (uint256);
}
