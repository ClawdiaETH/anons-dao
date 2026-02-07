// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AnonsSeeder} from "../../src/AnonsSeeder.sol";
import {AnonsDescriptor} from "../../src/AnonsDescriptor.sol";
import {IAnonsSeeder} from "../../src/interfaces/IAnonsSeeder.sol";

contract AnonsSeederTest is Test {
    AnonsSeeder public seeder;
    AnonsDescriptor public descriptor;

    // Sample scan-line RLE data: [top, right, bottom, left, runLength, colorIdx, ...]
    bytes constant SAMPLE_HEAD = hex"0420140004010c01";      // bounds + 2 runs
    bytes constant SAMPLE_BODY = hex"1020200c04010801"; // bounds + 2 runs
    bytes constant SAMPLE_ANTENNA = hex"000220000201";   // bounds + 1 run
    bytes constant SAMPLE_SPEC = hex"0a1a0c060102";      // bounds + 1 run
    bytes constant SAMPLE_ACCESSORY = hex"101a140c0101";  // bounds + 1 run

    function setUp() public {
        seeder = new AnonsSeeder();
        descriptor = new AnonsDescriptor();

        // Set a minimal palette
        string[] memory pal = new string[](2);
        pal[0] = "000000";
        pal[1] = "ffffff";
        descriptor.setPalette(pal);

        // Set backgrounds (2 dawn + 2 dusk = 4)
        string[] memory bgs = new string[](4);
        bgs[0] = "FEF3C7";
        bgs[1] = "FFEDD5";
        bgs[2] = "1E1B4B";
        bgs[3] = "312E81";
        descriptor.setBackgrounds(bgs);

        // Add 2 of each trait for variation
        bytes[] memory heads = new bytes[](2);
        heads[0] = SAMPLE_HEAD;
        heads[1] = SAMPLE_HEAD;
        descriptor.addManyHeads(heads);

        bytes[] memory specs = new bytes[](2);
        specs[0] = SAMPLE_SPEC;
        specs[1] = SAMPLE_SPEC;
        descriptor.addManySpecs(specs);

        bytes[] memory antennas = new bytes[](2);
        antennas[0] = SAMPLE_ANTENNA;
        antennas[1] = SAMPLE_ANTENNA;
        descriptor.addManyAntenna(antennas);

        bytes[] memory bodies = new bytes[](2);
        bodies[0] = SAMPLE_BODY;
        bodies[1] = SAMPLE_BODY;
        descriptor.addManyBodies(bodies);

        bytes[] memory accessories = new bytes[](2);
        accessories[0] = SAMPLE_ACCESSORY;
        accessories[1] = SAMPLE_ACCESSORY;
        descriptor.addManyAccessories(accessories);
    }

    function test_GenerateSeed_EvenTokenId_IsDawn() public {
        vm.roll(100);
        IAnonsSeeder.Seed memory seed = seeder.generateSeed(0, descriptor);
        assertFalse(seed.isDusk, "Token 0 should be dawn");

        seed = seeder.generateSeed(2, descriptor);
        assertFalse(seed.isDusk, "Token 2 should be dawn");

        seed = seeder.generateSeed(100, descriptor);
        assertFalse(seed.isDusk, "Token 100 should be dawn");
    }

    function test_GenerateSeed_OddTokenId_IsDusk() public {
        vm.roll(100);
        IAnonsSeeder.Seed memory seed = seeder.generateSeed(1, descriptor);
        assertTrue(seed.isDusk, "Token 1 should be dusk");

        seed = seeder.generateSeed(3, descriptor);
        assertTrue(seed.isDusk, "Token 3 should be dusk");

        seed = seeder.generateSeed(99, descriptor);
        assertTrue(seed.isDusk, "Token 99 should be dusk");
    }

    function test_GenerateSeed_DifferentBlockhash_DifferentSeed() public {
        vm.roll(100);
        IAnonsSeeder.Seed memory seed1 = seeder.generateSeed(0, descriptor);

        vm.roll(200);
        IAnonsSeeder.Seed memory seed2 = seeder.generateSeed(0, descriptor);

        vm.roll(300);
        IAnonsSeeder.Seed memory seed3 = seeder.generateSeed(2, descriptor);

        bool allSame12 = seed1.background == seed2.background && seed1.head == seed2.head
            && seed1.visor == seed2.visor && seed1.antenna == seed2.antenna && seed1.body == seed2.body
            && seed1.accessory == seed2.accessory;

        bool allSame13 = seed1.background == seed3.background && seed1.head == seed3.head
            && seed1.visor == seed3.visor && seed1.antenna == seed3.antenna && seed1.body == seed3.body
            && seed1.accessory == seed3.accessory;

        // At least one pair should differ
        assertTrue(!allSame12 || !allSame13, "Seeds should vary with different inputs");
    }

    function testFuzz_GenerateSeed_TraitsWithinBounds(uint256 tokenId) public {
        vm.roll(100);
        IAnonsSeeder.Seed memory seed = seeder.generateSeed(tokenId, descriptor);

        bool isDusk = tokenId % 2 == 1;
        assertEq(seed.isDusk, isDusk, "Cycle mismatch");

        // All traits should be within bounds
        assertTrue(seed.background < 2, "Background out of bounds");
        assertTrue(seed.head < 2, "Head out of bounds");
        assertTrue(seed.visor < 2, "Visor out of bounds");
        assertTrue(seed.antenna < 2, "Antenna out of bounds");
        assertTrue(seed.body < 2, "Body out of bounds");
        assertTrue(seed.accessory < 2, "Accessory out of bounds");
    }
}
