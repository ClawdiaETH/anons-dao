// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IAnonsDescriptor} from "./interfaces/IAnonsDescriptor.sol";
import {IAnonsSeeder} from "./interfaces/IAnonsSeeder.sol";
import {SSTORE2} from "./libs/SSTORE2.sol";
import {NFTDescriptor} from "./libs/NFTDescriptor.sol";

/// @title AnonsDescriptor
/// @notice On-chain SVG renderer for Anons using 255-color global palette and scan-line RLE
/// @dev Trait data format (from pipeline): [top, right, bottom, left, ...runLength, colorIdx pairs]
///      colorIdx: 0 = transparent (skip), 1-255 = palette[colorIdx - 1]
///      Specs (visors): colorIdx 0 = transparent, non-zero = visor glow color
contract AnonsDescriptor is IAnonsDescriptor, Ownable2Step {
    error DescriptorLocked();
    error EmptyData();
    error PaletteTooLarge();

    /// @notice Scale factor for rendering (32x32 coordinates -> 320x320 pixels)
    uint256 private constant SCALE = 10;

    /// @notice Global color palette (up to 255 hex color strings)
    string[] public palette;

    /// @notice Background colors — indices 0-1 dawn, 2-3 dusk
    string[] public backgrounds;

    /// @notice Whether the descriptor is locked
    bool private _isLocked;

    /// @notice Single trait storage (no dawn/dusk duplication)
    address[] private _heads;
    address[] private _specs;
    address[] private _antenna;
    address[] private _bodies;
    address[] private _accessories;

    /// @notice Trait names (parallel arrays to trait data)
    string[] private _headNames;
    string[] private _specsNames;
    string[] private _antennaNames;
    string[] private _bodyNames;
    string[] private _accessoryNames;
    string[] private _backgroundNames;

    constructor() Ownable(msg.sender) {}

    modifier whenNotLocked() {
        if (_isLocked) revert DescriptorLocked();
        _;
    }

    // ============ View Functions ============

    /// @inheritdoc IAnonsDescriptor
    function isLocked() external view override returns (bool) {
        return _isLocked;
    }

    /// @inheritdoc IAnonsDescriptor
    function lock() external override onlyOwner {
        _isLocked = true;
    }

    /// @inheritdoc IAnonsDescriptor
    function backgroundCount(bool) external view override returns (uint256) {
        // Dawn = indices 0..(len/2-1), Dusk = indices (len/2)..(len-1)
        return backgrounds.length / 2;
    }

    /// @inheritdoc IAnonsDescriptor
    function headCount(bool) external view override returns (uint256) {
        return _heads.length;
    }

    /// @inheritdoc IAnonsDescriptor
    function visorCount(bool) external view override returns (uint256) {
        return _specs.length;
    }

    /// @inheritdoc IAnonsDescriptor
    function antennaCount(bool) external view override returns (uint256) {
        return _antenna.length;
    }

    /// @inheritdoc IAnonsDescriptor
    function bodyCount(bool) external view override returns (uint256) {
        return _bodies.length;
    }

    /// @inheritdoc IAnonsDescriptor
    function accessoryCount(bool) external view override returns (uint256) {
        return _accessories.length;
    }

    // ============ Admin Functions ============

    /// @inheritdoc IAnonsDescriptor
    function setPalette(string[] calldata colors) external override onlyOwner whenNotLocked {
        if (colors.length == 0) revert EmptyData();
        if (colors.length > 255) revert PaletteTooLarge();

        // Clear and rebuild
        delete palette;
        for (uint256 i = 0; i < colors.length;) {
            palette.push(colors[i]);
            unchecked { ++i; }
        }
    }

    /// @inheritdoc IAnonsDescriptor
    function setBackgrounds(string[] calldata colors) external override onlyOwner whenNotLocked {
        if (colors.length == 0) revert EmptyData();

        delete backgrounds;
        for (uint256 i = 0; i < colors.length;) {
            backgrounds.push(colors[i]);
            unchecked { ++i; }
        }
    }

    /// @inheritdoc IAnonsDescriptor
    function setBackgroundNames(string[] calldata names) external override onlyOwner whenNotLocked {
        if (names.length == 0) revert EmptyData();
        delete _backgroundNames;
        for (uint256 i = 0; i < names.length;) {
            _backgroundNames.push(names[i]);
            unchecked { ++i; }
        }
    }

    /// @inheritdoc IAnonsDescriptor
    function setHeadNames(string[] calldata names) external override onlyOwner whenNotLocked {
        if (names.length == 0) revert EmptyData();
        delete _headNames;
        for (uint256 i = 0; i < names.length;) {
            _headNames.push(names[i]);
            unchecked { ++i; }
        }
    }

    /// @inheritdoc IAnonsDescriptor
    function setSpecsNames(string[] calldata names) external override onlyOwner whenNotLocked {
        if (names.length == 0) revert EmptyData();
        delete _specsNames;
        for (uint256 i = 0; i < names.length;) {
            _specsNames.push(names[i]);
            unchecked { ++i; }
        }
    }

    /// @inheritdoc IAnonsDescriptor
    function setAntennaNames(string[] calldata names) external override onlyOwner whenNotLocked {
        if (names.length == 0) revert EmptyData();
        delete _antennaNames;
        for (uint256 i = 0; i < names.length;) {
            _antennaNames.push(names[i]);
            unchecked { ++i; }
        }
    }

    /// @inheritdoc IAnonsDescriptor
    function setBodyNames(string[] calldata names) external override onlyOwner whenNotLocked {
        if (names.length == 0) revert EmptyData();
        delete _bodyNames;
        for (uint256 i = 0; i < names.length;) {
            _bodyNames.push(names[i]);
            unchecked { ++i; }
        }
    }

    /// @inheritdoc IAnonsDescriptor
    function setAccessoryNames(string[] calldata names) external override onlyOwner whenNotLocked {
        if (names.length == 0) revert EmptyData();
        delete _accessoryNames;
        for (uint256 i = 0; i < names.length;) {
            _accessoryNames.push(names[i]);
            unchecked { ++i; }
        }
    }

    /// @inheritdoc IAnonsDescriptor
    function addManyHeads(bytes[] calldata traitsData) external override onlyOwner whenNotLocked {
        _addMany(_heads, traitsData);
    }

    /// @inheritdoc IAnonsDescriptor
    function addManySpecs(bytes[] calldata traitsData) external override onlyOwner whenNotLocked {
        _addMany(_specs, traitsData);
    }

    /// @inheritdoc IAnonsDescriptor
    function addManyAntenna(bytes[] calldata traitsData) external override onlyOwner whenNotLocked {
        _addMany(_antenna, traitsData);
    }

    /// @inheritdoc IAnonsDescriptor
    function addManyBodies(bytes[] calldata traitsData) external override onlyOwner whenNotLocked {
        _addMany(_bodies, traitsData);
    }

    /// @inheritdoc IAnonsDescriptor
    function addManyAccessories(bytes[] calldata traitsData) external override onlyOwner whenNotLocked {
        _addMany(_accessories, traitsData);
    }

    function _addMany(address[] storage arr, bytes[] calldata traitsData) internal {
        for (uint256 i = 0; i < traitsData.length;) {
            if (traitsData[i].length == 0) revert EmptyData();
            arr.push(SSTORE2.write(traitsData[i]));
            unchecked { ++i; }
        }
    }

    // ============ SVG Generation ============

    /// @inheritdoc IAnonsDescriptor
    function generateSVGImage(IAnonsSeeder.Seed memory seed) public view override returns (string memory) {
        // Pick background: dawn = indices 0..(n/2-1), dusk = indices (n/2)..(n-1)
        uint256 half = backgrounds.length / 2;
        string memory bgColor;
        if (seed.isDusk) {
            bgColor = backgrounds[half + (seed.background % half)];
        } else {
            bgColor = backgrounds[seed.background % half];
        }

        // Build SVG with render order: Background -> Body -> Head -> Specs -> Antenna -> Accessory
        string memory svg = string(
            abi.encodePacked(
                NFTDescriptor.generateSVGHeader(320, 320),
                NFTDescriptor.generateRect(0, 0, 320, 320, bgColor),
                _generateTrait(_getPointer(_bodies, seed.body)),
                _generateTrait(_getPointer(_heads, seed.head)),
                _generateSpecs(_getPointer(_specs, seed.visor)),
                _generateTrait(_getPointer(_antenna, seed.antenna)),
                _generateTrait(_getPointer(_accessories, seed.accessory)),
                "</svg>"
            )
        );

        return svg;
    }

    /// @inheritdoc IAnonsDescriptor
    function tokenURI(uint256 tokenId, IAnonsSeeder.Seed memory seed) external view override returns (string memory) {
        string memory name = string(abi.encodePacked("Anon #", NFTDescriptor.toString(tokenId)));
        string memory description = seed.isDusk
            ? "A dusk-cycle Anon. Part of the autonomous AI collective."
            : "A dawn-cycle Anon. Part of the autonomous AI collective.";

        string memory image = generateSVGImage(seed);

        // Get trait names, falling back to numbers if names not set
        uint256 bgIndex = seed.background % (backgrounds.length / 2);
        string memory backgroundName = _getTraitName(_backgroundNames, bgIndex, seed.background);
        string memory headName = _getTraitName(_headNames, seed.head % _heads.length, seed.head);
        string memory specsName = _getTraitName(_specsNames, seed.visor % _specs.length, seed.visor);
        string memory antennaName = _getTraitName(_antennaNames, seed.antenna % _antenna.length, seed.antenna);
        string memory bodyName = _getTraitName(_bodyNames, seed.body % _bodies.length, seed.body);
        string memory accessoryName = _getTraitName(_accessoryNames, seed.accessory % _accessories.length, seed.accessory);

        string memory attributes = string(
            abi.encodePacked(
                '[{"trait_type":"Cycle","value":"',
                seed.isDusk ? "Dusk" : "Dawn",
                '"},{"trait_type":"Background","value":"',
                backgroundName,
                '"},{"trait_type":"Head","value":"',
                headName,
                '"},{"trait_type":"Specs","value":"',
                specsName,
                '"},{"trait_type":"Antenna","value":"',
                antennaName,
                '"},{"trait_type":"Body","value":"',
                bodyName,
                '"},{"trait_type":"Accessory","value":"',
                accessoryName,
                '"}]'
            )
        );

        return NFTDescriptor.constructTokenURI(name, description, image, attributes);
    }

    // ============ Internal Helpers ============

    function _getPointer(address[] storage arr, uint8 id) internal view returns (address) {
        if (arr.length == 0) return address(0);
        return arr[id % arr.length];
    }

    /// @notice Gets the trait name for a given index, falling back to the number if no name is set
    /// @param names The array of names
    /// @param index The effective index (already modulo'd to array length)
    /// @param rawValue The original seed value (used as fallback)
    function _getTraitName(string[] storage names, uint256 index, uint256 rawValue) internal view returns (string memory) {
        if (names.length > index && bytes(names[index]).length > 0) {
            return names[index];
        }
        return NFTDescriptor.toString(rawValue);
    }

    /// @notice Decodes scan-line RLE data and generates SVG rects using the global palette
    /// @dev Format: [top, right, bottom, left, ...runLength, colorIdx pairs]
    ///      colorIdx 0 = transparent (skip), 1-255 = palette[colorIdx - 1]
    function _generateTrait(address pointer) internal view returns (string memory) {
        if (pointer == address(0)) return "";

        bytes memory data = SSTORE2.read(pointer);
        if (data.length < 4) return "";

        uint256 top = uint256(uint8(data[0]));
        uint256 right = uint256(uint8(data[1]));
        // data[2] = bottom (unused — stream terminates naturally)
        uint256 left = uint256(uint8(data[3]));

        bytes memory result;
        uint256 cursor = 4;
        uint256 x = left;
        uint256 y = top;

        while (cursor + 1 < data.length) {
            uint256 runLength = uint256(uint8(data[cursor]));
            uint256 colorIdx = uint256(uint8(data[cursor + 1]));
            cursor += 2;

            if (colorIdx != 0 && colorIdx <= palette.length) {
                result = abi.encodePacked(
                    result,
                    NFTDescriptor.generateRect(
                        x * SCALE,
                        y * SCALE,
                        runLength * SCALE,
                        1 * SCALE,
                        palette[colorIdx - 1]
                    )
                );
            }

            x += runLength;
            if (x >= right) {
                x = left;
                y++;
            }
        }

        return string(result);
    }

    /// @notice Decodes scan-line RLE specs data using palette colors
    /// @dev Specs now render with their actual palette colors for gradient effects
    function _generateSpecs(address pointer) internal view returns (string memory) {
        if (pointer == address(0)) return "";

        bytes memory data = SSTORE2.read(pointer);
        if (data.length < 4) return "";

        uint256 top = uint256(uint8(data[0]));
        uint256 right = uint256(uint8(data[1]));
        // data[2] = bottom (unused — stream terminates naturally)
        uint256 left = uint256(uint8(data[3]));

        bytes memory result;
        uint256 cursor = 4;
        uint256 x = left;
        uint256 y = top;

        while (cursor + 1 < data.length) {
            uint256 runLength = uint256(uint8(data[cursor]));
            uint256 colorIdx = uint256(uint8(data[cursor + 1]));
            cursor += 2;

            if (colorIdx != 0 && colorIdx <= palette.length) {
                result = abi.encodePacked(
                    result,
                    NFTDescriptor.generateRect(
                        x * SCALE,
                        y * SCALE,
                        runLength * SCALE,
                        1 * SCALE,
                        palette[colorIdx - 1]
                    )
                );
            }

            x += runLength;
            if (x >= right) {
                x = left;
                y++;
            }
        }

        return string(result);
    }
}
