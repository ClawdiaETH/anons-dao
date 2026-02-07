// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAnonsSeeder} from "./interfaces/IAnonsSeeder.sol";
import {IAnonsDescriptor} from "./interfaces/IAnonsDescriptor.sol";

/// @title AnonsSeeder
/// @notice Pseudorandom trait selection for Anons
/// @dev Pure logic contract with no state
contract AnonsSeeder is IAnonsSeeder {
    /// @inheritdoc IAnonsSeeder
    function generateSeed(uint256 tokenId, IAnonsDescriptor descriptor) external view override returns (Seed memory) {
        // Determine cycle based on tokenId (even = dawn, odd = dusk)
        bool isDusk = tokenId % 2 == 1;

        // Generate pseudorandom number with multiple entropy sources
        // Note: This is still pseudo-random and somewhat predictable, but significantly
        // harder to manipulate than blockhash alone. For maximum security, use Chainlink VRF.
        uint256 pseudorandomness = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),  // Previous block hash
                    tokenId,                       // Predictable but necessary for determinism
                    block.prevrandao,              // PREVRANDAO (difficulty on L2s)
                    block.timestamp,               // Block timestamp
                    block.number,                  // Current block number
                    tx.gasprice                    // Transaction gas price (varies)
                )
            )
        );

        // Get trait counts for the appropriate cycle
        uint256 bgCount = descriptor.backgroundCount(isDusk);
        uint256 headCount = descriptor.headCount(isDusk);
        uint256 visorCount = descriptor.visorCount(isDusk);
        uint256 antennaCount = descriptor.antennaCount(isDusk);
        uint256 bodyCount = descriptor.bodyCount(isDusk);
        uint256 accessoryCount = descriptor.accessoryCount(isDusk);

        return Seed({
            background: uint8(uint8(pseudorandomness) % bgCount),
            head: uint8(uint8(pseudorandomness >> 8) % headCount),
            visor: uint8(uint8(pseudorandomness >> 16) % visorCount),
            antenna: uint8(uint8(pseudorandomness >> 24) % antennaCount),
            body: uint8(uint8(pseudorandomness >> 32) % bodyCount),
            accessory: uint8(uint8(pseudorandomness >> 40) % accessoryCount),
            isDusk: isDusk
        });
    }
}
