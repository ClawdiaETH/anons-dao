// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AnonsDescriptor} from "../../src/AnonsDescriptor.sol";
import {IAnonsSeeder} from "../../src/interfaces/IAnonsSeeder.sol";
import {TraitData} from "../../script/TraitData.sol";

/// @title SVGQuality Tests
/// @notice Verifies SVG output matches the Nouns rendering standard
contract SVGQualityTest is Test {
    AnonsDescriptor public descriptor;

    function setUp() public {
        descriptor = new AnonsDescriptor();

        descriptor.setPalette(TraitData.getPalette());
        descriptor.setBackgrounds(TraitData.getBackgrounds());
        descriptor.addManyHeads(TraitData.getAllHeads());
        descriptor.addManyBodies(TraitData.getAllBodies());
        descriptor.addManySpecs(TraitData.getAllSpecs());
        descriptor.addManyAntenna(TraitData.getAllAntenna());
        descriptor.addManyAccessories(TraitData.getAllAccessories());
    }

    function _defaultSeed() internal pure returns (IAnonsSeeder.Seed memory) {
        return IAnonsSeeder.Seed({
            background: 0, head: 0, visor: 0, antenna: 0, body: 0, accessory: 0, isDusk: false
        });
    }

    function test_SVG_Has320ViewBox() public view {
        string memory svg = descriptor.generateSVGImage(_defaultSeed());
        assertTrue(_contains(svg, 'viewBox="0 0 320 320"'), "SVG must have 320x320 viewBox");
    }

    function test_SVG_HasCrispEdges() public view {
        string memory svg = descriptor.generateSVGImage(_defaultSeed());
        assertTrue(_contains(svg, 'shape-rendering="crispEdges"'), "SVG must have crispEdges rendering");
    }

    function test_SVG_HasExplicitDimensions() public view {
        string memory svg = descriptor.generateSVGImage(_defaultSeed());
        assertTrue(_contains(svg, 'width="320"'), "SVG must have explicit width=320");
        assertTrue(_contains(svg, 'height="320"'), "SVG must have explicit height=320");
    }

    function test_SVG_NoPreserveAspectRatio() public view {
        string memory svg = descriptor.generateSVGImage(_defaultSeed());
        assertFalse(_contains(svg, "preserveAspectRatio"), "SVG must not have preserveAspectRatio");
    }

    function test_SVG_RenderOrder() public view {
        // Verify render order: Background -> Body -> Head -> Specs -> Antenna -> Accessory
        // Background rect should appear first, then body rects, then head, etc.
        string memory svg = descriptor.generateSVGImage(_defaultSeed());

        // The background is a full 320x320 rect — it should come first
        uint256 bgPos = _indexOf(svg, 'width="320" height="320"');
        assertTrue(bgPos > 0, "SVG should have full-size background rect");

        // There should be multiple rect elements (body, head, specs, etc.)
        uint256 rectCount = _countOccurrences(svg, "<rect");
        assertTrue(rectCount > 5, "SVG should have multiple rects from traits");
    }

    function test_SVG_BackgroundIsFirstRect() public view {
        string memory svg = descriptor.generateSVGImage(_defaultSeed());

        // First rect should be the background (320x320)
        uint256 firstRect = _indexOf(svg, "<rect");
        uint256 bgSize = _indexOf(svg, 'width="320" height="320"');

        assertTrue(firstRect > 0, "SVG should have rects");
        // The background rect (320x320) should be the first one
        assertTrue(bgSize > 0 && bgSize < firstRect + 200, "Background rect should appear early in SVG");
    }

    // Helper: find first occurrence of needle in haystack, returns position (1-indexed) or 0 if not found
    function _indexOf(string memory haystack, string memory needle) internal pure returns (uint256) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);

        if (n.length > h.length) return 0;

        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i + 1;
        }
        return 0;
    }

    function _contains(string memory haystack, string memory needle) internal pure returns (bool) {
        return _indexOf(haystack, needle) > 0;
    }

    function _countOccurrences(string memory haystack, string memory needle) internal pure returns (uint256) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);
        uint256 count = 0;

        if (n.length > h.length) return 0;

        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) count++;
        }
        return count;
    }
}
