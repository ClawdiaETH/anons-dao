// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAnonsDescriptor} from "./IAnonsDescriptor.sol";

/// @title IAnonsSeeder
/// @notice Interface for the AnonsSeeder contract
interface IAnonsSeeder {
    /// @notice Seed struct for storing Anon traits
    struct Seed {
        uint8 background;
        uint8 head;      // renamed from chassis
        uint8 visor;     // renamed from eyes
        uint8 antenna;
        uint8 body;
        uint8 accessory;
        bool isDusk; // false = dawn, true = dusk
    }

    /// @notice Generates a pseudorandom seed for an Anon
    /// @param tokenId The token ID to generate a seed for
    /// @param descriptor The descriptor contract for trait counts
    /// @return The generated seed
    function generateSeed(uint256 tokenId, IAnonsDescriptor descriptor) external view returns (Seed memory);
}
