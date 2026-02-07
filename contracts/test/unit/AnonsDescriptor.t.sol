// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AnonsDescriptor} from "../../src/AnonsDescriptor.sol";
import {IAnonsSeeder} from "../../src/interfaces/IAnonsSeeder.sol";
import {TraitData} from "../../script/TraitData.sol";

contract AnonsDescriptorTest is Test {
    AnonsDescriptor public descriptor;
    address public owner;

    function setUp() public {
        owner = address(this);
        descriptor = new AnonsDescriptor();

        // Upload full trait set
        _uploadAllTraits();
    }

    function _uploadAllTraits() internal {
        descriptor.setPalette(TraitData.getPalette());
        descriptor.setBackgrounds(TraitData.getBackgrounds());
        descriptor.addManyHeads(TraitData.getAllHeads());
        descriptor.addManyBodies(TraitData.getAllBodies());
        descriptor.addManySpecs(TraitData.getAllSpecs());
        descriptor.addManyAntenna(TraitData.getAllAntenna());
        descriptor.addManyAccessories(TraitData.getAllAccessories());
    }

    function test_BackgroundCount() public view {
        // 4 backgrounds total, 2 per cycle
        assertEq(descriptor.backgroundCount(false), 2);
        assertEq(descriptor.backgroundCount(true), 2);
    }

    function test_TraitCounts() public view {
        assertEq(descriptor.headCount(false), 189);
        assertEq(descriptor.headCount(true), 189);
        assertEq(descriptor.visorCount(false), 77);
        assertEq(descriptor.visorCount(true), 77);
        assertEq(descriptor.antennaCount(false), 16);
        assertEq(descriptor.antennaCount(true), 16);
        assertEq(descriptor.bodyCount(false), 30);
        assertEq(descriptor.bodyCount(true), 30);
        assertEq(descriptor.accessoryCount(false), 145);
        assertEq(descriptor.accessoryCount(true), 145);
    }

    function test_SetPalette_RevertsIfEmpty() public {
        string[] memory empty = new string[](0);
        vm.expectRevert(AnonsDescriptor.EmptyData.selector);
        descriptor.setPalette(empty);
    }

    function test_SetPalette_RevertsIfTooLarge() public {
        string[] memory colors = new string[](256);
        for (uint256 i = 0; i < 256; i++) {
            colors[i] = "FF0000";
        }
        vm.expectRevert(AnonsDescriptor.PaletteTooLarge.selector);
        descriptor.setPalette(colors);
    }

    function test_Lock_PreventsUpdates() public {
        assertFalse(descriptor.isLocked());

        descriptor.lock();
        assertTrue(descriptor.isLocked());

        bytes[] memory data = new bytes[](1);
        data[0] = hex"00010100";
        vm.expectRevert(AnonsDescriptor.DescriptorLocked.selector);
        descriptor.addManyHeads(data);
    }

    function test_GenerateSVGImage_Dawn() public view {
        IAnonsSeeder.Seed memory seed = IAnonsSeeder.Seed({
            background: 0,
            head: 0,
            visor: 0,
            antenna: 0,
            body: 0,
            accessory: 0,
            isDusk: false
        });

        string memory svg = descriptor.generateSVGImage(seed);

        assertTrue(bytes(svg).length > 0, "SVG should not be empty");
        assertTrue(_contains(svg, "<svg"), "Should contain svg tag");
        assertTrue(_contains(svg, "</svg>"), "Should close svg tag");
        assertTrue(_contains(svg, 'viewBox="0 0 320 320"'), "Should have 320x320 viewBox");
        assertTrue(_contains(svg, 'shape-rendering="crispEdges"'), "Should have crispEdges rendering");
        assertTrue(_contains(svg, 'width="320"'), "Should have explicit width");
        assertTrue(_contains(svg, 'height="320"'), "Should have explicit height");
        assertFalse(_contains(svg, "preserveAspectRatio"), "Should not have preserveAspectRatio");
    }

    function test_GenerateSVGImage_Dusk() public view {
        IAnonsSeeder.Seed memory seed = IAnonsSeeder.Seed({
            background: 1,
            head: 1,
            visor: 1,
            antenna: 1,
            body: 1,
            accessory: 1,
            isDusk: true
        });

        string memory svg = descriptor.generateSVGImage(seed);
        assertTrue(bytes(svg).length > 0, "SVG should not be empty");
        assertTrue(_contains(svg, 'viewBox="0 0 320 320"'), "Dusk should also have 320x320 viewBox");
    }

    function test_GenerateSVGImage_HasColoredRects() public view {
        IAnonsSeeder.Seed memory seed = IAnonsSeeder.Seed({
            background: 0,
            head: 0,
            visor: 0,
            antenna: 0,
            body: 0,
            accessory: 0,
            isDusk: false
        });

        string memory svg = descriptor.generateSVGImage(seed);

        // Should contain rects with palette colors (not just the background)
        assertTrue(_contains(svg, "<rect"), "Should contain rect elements");
        assertTrue(_contains(svg, "fill="), "Should have filled rects");
    }

    function test_TokenURI_ReturnsBase64JSON() public view {
        IAnonsSeeder.Seed memory seed = IAnonsSeeder.Seed({
            background: 0,
            head: 0,
            visor: 0,
            antenna: 0,
            body: 0,
            accessory: 0,
            isDusk: false
        });

        string memory uri = descriptor.tokenURI(0, seed);
        assertTrue(_contains(uri, "data:application/json;base64,"), "Should be base64 JSON data URI");
    }

    function test_OnlyOwner_CanAddTraits() public {
        address notOwner = address(0x1234);
        bytes[] memory data = new bytes[](1);
        data[0] = hex"00010100";

        vm.prank(notOwner);
        vm.expectRevert();
        descriptor.addManyHeads(data);
    }

    function test_ManyTraits_AllRender() public view {
        for (uint8 h = 0; h < 5; h++) {
            for (uint8 b = 0; b < 3; b++) {
                IAnonsSeeder.Seed memory seed = IAnonsSeeder.Seed({
                    background: h % 2,
                    head: h,
                    visor: h,
                    antenna: h,
                    body: b,
                    accessory: b,
                    isDusk: h % 2 == 1
                });

                string memory svg = descriptor.generateSVGImage(seed);
                assertTrue(bytes(svg).length > 100, "SVG should be substantial");
                assertTrue(_contains(svg, "<svg"), "Should contain svg tag");
                assertTrue(_contains(svg, "</svg>"), "Should close svg tag");
            }
        }
    }

    function test_DawnDusk_DifferentBackgrounds() public view {
        IAnonsSeeder.Seed memory dawn = IAnonsSeeder.Seed({
            background: 0, head: 0, visor: 0, antenna: 0, body: 0, accessory: 0, isDusk: false
        });
        IAnonsSeeder.Seed memory dusk = IAnonsSeeder.Seed({
            background: 0, head: 0, visor: 0, antenna: 0, body: 0, accessory: 0, isDusk: true
        });

        string memory dawnSvg = descriptor.generateSVGImage(dawn);
        string memory duskSvg = descriptor.generateSVGImage(dusk);

        // Dawn bg[0] and dusk bg[0] should be different colors
        // Both SVGs should contain rects but have different backgrounds
        assertTrue(bytes(dawnSvg).length > 0);
        assertTrue(bytes(duskSvg).length > 0);
        assertTrue(keccak256(bytes(dawnSvg)) != keccak256(bytes(duskSvg)), "Dawn and dusk should render differently");
    }

    // Helper function to check if string contains substring
    function _contains(string memory haystack, string memory needle) internal pure returns (bool) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);

        if (n.length > h.length) return false;

        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }
}
