// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAnonsSeeder} from "./IAnonsSeeder.sol";
import {IAnonsDescriptor} from "./IAnonsDescriptor.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title IAnonsToken
/// @notice Interface for the AnonsToken ERC-721 contract
interface IAnonsToken is IERC721 {
    /// @notice Emitted when an Anon is created
    /// @param tokenId The ID of the created token
    /// @param seed The seed used to generate the token's traits
    event AnonCreated(uint256 indexed tokenId, IAnonsSeeder.Seed seed);

    /// @notice Emitted when the minter is updated
    /// @param minter The new minter address
    event MinterUpdated(address indexed minter);

    /// @notice Emitted when the minter is locked
    event MinterLocked();

    /// @notice Emitted when the descriptor is updated
    /// @param descriptor The new descriptor address
    event DescriptorUpdated(IAnonsDescriptor indexed descriptor);

    /// @notice Emitted when the descriptor is locked
    event DescriptorLocked();

    /// @notice Emitted when the seeder is updated
    /// @param seeder The new seeder address
    event SeederUpdated(IAnonsSeeder indexed seeder);

    /// @notice Emitted when the seeder is locked
    event SeederLocked();

    /// @notice Mints a new Anon to the specified address
    /// @return The ID of the newly minted token
    function mint() external returns (uint256);

    /// @notice Burns an Anon token
    /// @param tokenId The ID of the token to burn
    function burn(uint256 tokenId) external;

    /// @notice Returns the seed for a given token
    /// @param tokenId The ID of the token
    /// @return The seed for the token
    function seeds(uint256 tokenId) external view returns (IAnonsSeeder.Seed memory);

    /// @notice Returns the descriptor contract
    function descriptor() external view returns (IAnonsDescriptor);

    /// @notice Returns the seeder contract
    function seeder() external view returns (IAnonsSeeder);

    /// @notice Returns the minter address
    function minter() external view returns (address);

    /// @notice Sets the minter address
    /// @param minter The new minter address
    function setMinter(address minter) external;

    /// @notice Locks the minter, preventing future updates
    function lockMinter() external;

    /// @notice Sets the descriptor contract
    /// @param descriptor The new descriptor contract
    function setDescriptor(IAnonsDescriptor descriptor) external;

    /// @notice Locks the descriptor, preventing future updates
    function lockDescriptor() external;

    /// @notice Sets the seeder contract
    /// @param seeder The new seeder contract
    function setSeeder(IAnonsSeeder seeder) external;

    /// @notice Locks the seeder, preventing future updates
    function lockSeeder() external;
}
