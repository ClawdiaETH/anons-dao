// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title NFTDescriptor
/// @notice Library for encoding NFT metadata as base64 data URIs
library NFTDescriptor {
    string internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /// @notice Encodes bytes to base64
    /// @param data The data to encode
    /// @return The base64 encoded string
    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = TABLE;
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);

        assembly {
            mstore(result, encodedLen)

            let tablePtr := add(table, 1)
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            let resultPtr := add(result, 32)

            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }

            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 1), 0x3d)
                mstore8(sub(resultPtr, 2), 0x3d)
            }
            case 2 { mstore8(sub(resultPtr, 1), 0x3d) }
        }

        return result;
    }

    /// @notice Creates a token URI with base64-encoded JSON metadata
    /// @param name The token name
    /// @param description The token description
    /// @param image The SVG image as a string
    /// @param attributes JSON attributes array as a string
    /// @return The complete token URI
    function constructTokenURI(
        string memory name,
        string memory description,
        string memory image,
        string memory attributes
    ) internal pure returns (string memory) {
        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                name,
                '","description":"',
                description,
                '","image":"data:image/svg+xml;base64,',
                encode(bytes(image)),
                '","attributes":',
                attributes,
                "}"
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", encode(bytes(json))));
    }

    /// @notice Converts a uint256 to a string
    /// @param value The value to convert
    /// @return The string representation
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /// @notice Generates SVG rect element
    /// @param x X coordinate
    /// @param y Y coordinate
    /// @param width Width
    /// @param height Height
    /// @param fill Fill color (hex without #)
    /// @return The SVG rect element
    function generateRect(uint256 x, uint256 y, uint256 width, uint256 height, string memory fill)
        internal
        pure
        returns (string memory)
    {
        return string(
            abi.encodePacked(
                '<rect x="',
                toString(x),
                '" y="',
                toString(y),
                '" width="',
                toString(width),
                '" height="',
                toString(height),
                '" fill="#',
                fill,
                '" shape-rendering="crispEdges"/>'
            )
        );
    }

    /// @notice Generates SVG header
    /// @param width SVG width
    /// @param height SVG height
    /// @return The SVG header
    function generateSVGHeader(uint256 width, uint256 height) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="',
                toString(width),
                '" height="',
                toString(height),
                '" viewBox="0 0 ',
                toString(width),
                " ",
                toString(height),
                '" shape-rendering="crispEdges">'
            )
        );
    }
}
