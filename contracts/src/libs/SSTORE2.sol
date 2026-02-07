// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SSTORE2
/// @notice Gas-efficient storage library for large data blobs
/// @dev Stores data as contract bytecode for cheaper reads
library SSTORE2 {
    error DeploymentFailed();
    error InvalidPointer();
    error ReadOutOfBounds();

    /// @notice Writes data to a new contract and returns the address pointer
    /// @param data The data to store
    /// @return pointer The address of the contract storing the data
    function write(bytes memory data) internal returns (address pointer) {
        // Prefix data with STOP opcode (0x00) to prevent execution
        bytes memory runtimeCode = abi.encodePacked(hex"00", data);

        bytes memory creationCode = abi.encodePacked(
            // Constructor: return(0, codesize)
            hex"61", // PUSH2 <size>
            uint16(runtimeCode.length),
            hex"80", // DUP1
            hex"60", // PUSH1 0x0c (offset after constructor = 12 bytes)
            hex"0c",
            hex"60", // PUSH1 0x00
            hex"00",
            hex"39", // CODECOPY
            hex"60", // PUSH1 0x00
            hex"00",
            hex"f3", // RETURN
            runtimeCode
        );

        assembly {
            pointer := create(0, add(creationCode, 0x20), mload(creationCode))
        }

        if (pointer == address(0)) revert DeploymentFailed();
    }

    /// @notice Reads data from a storage contract
    /// @param pointer The address of the storage contract
    /// @return data The stored data
    function read(address pointer) internal view returns (bytes memory data) {
        if (pointer.code.length == 0) revert InvalidPointer();

        // Skip the first byte (STOP opcode)
        uint256 size = pointer.code.length - 1;

        assembly {
            data := mload(0x40)
            mstore(0x40, add(data, add(size, 0x40)))
            mstore(data, size)
            extcodecopy(pointer, add(data, 0x20), 1, size)
        }
    }

    /// @notice Reads a slice of data from a storage contract
    /// @param pointer The address of the storage contract
    /// @param start The start index
    /// @param end The end index
    /// @return data The stored data slice
    function read(address pointer, uint256 start, uint256 end) internal view returns (bytes memory data) {
        if (pointer.code.length == 0) revert InvalidPointer();

        uint256 size = pointer.code.length - 1;
        if (start > size || end > size || start > end) revert ReadOutOfBounds();

        uint256 length = end - start;

        assembly {
            data := mload(0x40)
            mstore(0x40, add(data, add(length, 0x40)))
            mstore(data, length)
            extcodecopy(pointer, add(data, 0x20), add(start, 1), length)
        }
    }
}
