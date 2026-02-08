// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IWETH} from "../../src/interfaces/IWETH.sol";

/// @title MockWETH
/// @notice Mock WETH for testing
contract MockWETH is IWETH {
    mapping(address => uint256) public balanceOf;

    function deposit() external payable override {
        balanceOf[msg.sender] += msg.value;
    }

    function transfer(address to, uint256 value) external override returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        return true;
    }
}
