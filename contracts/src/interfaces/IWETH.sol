// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IWETH
/// @notice Interface for Wrapped ETH
interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint256 value) external returns (bool);
}
