// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAnonsSeeder} from "./IAnonsSeeder.sol";

/// @title IAnonsDescriptor
/// @notice Interface for the AnonsDescriptor contract
interface IAnonsDescriptor {
    /// @notice Returns the number of backgrounds for a given cycle
    /// @param isDusk Whether to get dusk (true) or dawn (false) backgrounds
    function backgroundCount(bool isDusk) external view returns (uint256);

    /// @notice Returns the number of heads for a given cycle
    /// @param isDusk Ignored — returns the same count for both cycles
    function headCount(bool isDusk) external view returns (uint256);

    /// @notice Returns the number of visors (specs) for a given cycle
    /// @param isDusk Ignored — returns the same count for both cycles
    function visorCount(bool isDusk) external view returns (uint256);

    /// @notice Returns the number of antenna for a given cycle
    /// @param isDusk Ignored — returns the same count for both cycles
    function antennaCount(bool isDusk) external view returns (uint256);

    /// @notice Returns the number of bodies for a given cycle
    /// @param isDusk Ignored — returns the same count for both cycles
    function bodyCount(bool isDusk) external view returns (uint256);

    /// @notice Returns the number of accessories for a given cycle
    /// @param isDusk Ignored — returns the same count for both cycles
    function accessoryCount(bool isDusk) external view returns (uint256);

    /// @notice Sets the global color palette (up to 255 colors)
    /// @param colors Array of 6-char hex color strings (e.g. "FF0000")
    function setPalette(string[] calldata colors) external;

    /// @notice Sets the background colors
    /// @dev Indices 0-1 = dawn, 2-3 = dusk
    /// @param colors Array of 6-char hex color strings
    function setBackgrounds(string[] calldata colors) external;

    /// @notice Batch add heads
    /// @param traitsData Array of RLE-encoded head data
    function addManyHeads(bytes[] calldata traitsData) external;

    /// @notice Batch add specs (visors)
    /// @param traitsData Array of RLE-encoded specs data
    function addManySpecs(bytes[] calldata traitsData) external;

    /// @notice Batch add antenna
    /// @param traitsData Array of RLE-encoded antenna data
    function addManyAntenna(bytes[] calldata traitsData) external;

    /// @notice Batch add bodies
    /// @param traitsData Array of RLE-encoded body data
    function addManyBodies(bytes[] calldata traitsData) external;

    /// @notice Batch add accessories
    /// @param traitsData Array of RLE-encoded accessory data
    function addManyAccessories(bytes[] calldata traitsData) external;

    /// @notice Generates the SVG image for a given seed
    /// @param seed The seed to generate an image for
    /// @return The SVG image as a string
    function generateSVGImage(IAnonsSeeder.Seed memory seed) external view returns (string memory);

    /// @notice Generates the full token URI for a given token
    /// @param tokenId The token ID
    /// @param seed The seed for the token
    /// @return The token URI as a base64-encoded JSON string
    function tokenURI(uint256 tokenId, IAnonsSeeder.Seed memory seed) external view returns (string memory);

    /// @notice Returns whether the descriptor is locked (no more updates allowed)
    function isLocked() external view returns (bool);

    /// @notice Locks the descriptor, preventing further updates
    function lock() external;
}
