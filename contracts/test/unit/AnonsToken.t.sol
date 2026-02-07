// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AnonsToken} from "../../src/AnonsToken.sol";
import {AnonsDescriptor} from "../../src/AnonsDescriptor.sol";
import {AnonsSeeder} from "../../src/AnonsSeeder.sol";
import {IAnonsSeeder} from "../../src/interfaces/IAnonsSeeder.sol";
import {IAnonsToken} from "../../src/interfaces/IAnonsToken.sol";

contract AnonsTokenTest is Test {
    AnonsToken public token;
    AnonsDescriptor public descriptor;
    AnonsSeeder public seeder;

    address public owner;
    address public clawdia = address(0xC1a0d1a);
    address public minter = address(0x1234);
    address public user = address(0x5678);

    function setUp() public {
        owner = address(this);
        descriptor = new AnonsDescriptor();
        seeder = new AnonsSeeder();

        // Set up minimal descriptor with new API
        string[] memory pal = new string[](2);
        pal[0] = "000000";
        pal[1] = "ffffff";
        descriptor.setPalette(pal);

        string[] memory bgs = new string[](4);
        bgs[0] = "FEF3C7";
        bgs[1] = "FFEDD5";
        bgs[2] = "1E1B4B";
        bgs[3] = "312E81";
        descriptor.setBackgrounds(bgs);

        bytes[] memory heads = new bytes[](1);
        heads[0] = hex"0420140004010c01";
        descriptor.addManyHeads(heads);

        bytes[] memory specs = new bytes[](1);
        specs[0] = hex"0a1a0c060102";
        descriptor.addManySpecs(specs);

        bytes[] memory antennas = new bytes[](1);
        antennas[0] = hex"000220000201";
        descriptor.addManyAntenna(antennas);

        bytes[] memory bodies = new bytes[](1);
        bodies[0] = hex"1020200c04010801";
        descriptor.addManyBodies(bodies);

        bytes[] memory accessories = new bytes[](1);
        accessories[0] = hex"101a140c0101";
        descriptor.addManyAccessories(accessories);

        vm.roll(100); // Set block number for seed generation
        IAnonsSeeder.Seed memory clawdiaSeed = IAnonsSeeder.Seed({
            background: 0, head: 0, visor: 0, antenna: 0, body: 0, accessory: 0, isDusk: false
        });
        token = new AnonsToken(clawdia, descriptor, seeder, clawdiaSeed);
        token.setMinter(minter);
    }

    function test_Constructor_MintsToken0ToClawdia() public view {
        assertEq(token.ownerOf(0), clawdia, "Token 0 should be owned by Clawdia");
        assertEq(token.balanceOf(clawdia), 1, "Clawdia should have 1 token");
    }

    function test_Constructor_Token0HasCustomSeed() public view {
        IAnonsSeeder.Seed memory seed = token.seeds(0);
        assertEq(seed.background, 0, "Token 0 should have background=0");
        assertEq(seed.head, 0, "Token 0 should have head=0");
        assertEq(seed.visor, 0, "Token 0 should have visor=0");
        assertEq(seed.antenna, 0, "Token 0 should have antenna=0");
        assertEq(seed.body, 0, "Token 0 should have body=0");
        assertEq(seed.accessory, 0, "Token 0 should have accessory=0");
        assertFalse(seed.isDusk, "Token 0 should be dawn (isDusk=false)");
    }

    function test_Constructor_CustomSeedWithSpecificTraits() public {
        // Deploy a new token with specific custom seed for Clawdia
        IAnonsSeeder.Seed memory customSeed = IAnonsSeeder.Seed({
            background: 2,
            head: 1,
            visor: 3,
            antenna: 0,
            body: 2,
            accessory: 1,
            isDusk: true
        });
        AnonsToken tokenWithCustom = new AnonsToken(clawdia, descriptor, seeder, customSeed);

        IAnonsSeeder.Seed memory storedSeed = tokenWithCustom.seeds(0);
        assertEq(storedSeed.background, 2, "Custom background should be stored");
        assertEq(storedSeed.head, 1, "Custom head should be stored");
        assertEq(storedSeed.visor, 3, "Custom visor should be stored");
        assertEq(storedSeed.antenna, 0, "Custom antenna should be stored");
        assertEq(storedSeed.body, 2, "Custom body should be stored");
        assertEq(storedSeed.accessory, 1, "Custom accessory should be stored");
        assertTrue(storedSeed.isDusk, "Token 0 should be dusk (isDusk=true)");
    }

    function test_Constructor_SetsNameAndSymbol() public view {
        assertEq(token.name(), "Anons");
        assertEq(token.symbol(), "ANON");
    }

    function test_Mint_OnlyMinter() public {
        vm.prank(minter);
        uint256 tokenId = token.mint();
        assertEq(tokenId, 1, "First mint should be token 1");
        assertEq(token.ownerOf(1), minter, "Minter should own the minted token");
    }

    function test_Mint_RevertsIfNotMinter() public {
        vm.prank(user);
        vm.expectRevert(AnonsToken.OnlyMinter.selector);
        token.mint();
    }

    function test_Mint_IncreasesTotalSupply() public {
        assertEq(token.totalSupply(), 1); // Token 0

        vm.prank(minter);
        token.mint();
        assertEq(token.totalSupply(), 2);

        vm.prank(minter);
        token.mint();
        assertEq(token.totalSupply(), 3);
    }

    function test_Mint_EmitsAnonCreated() public {
        vm.prank(minter);
        vm.expectEmit(true, false, false, false);
        emit IAnonsToken.AnonCreated(1, IAnonsSeeder.Seed(0, 0, 0, 0, 0, 0, false));
        token.mint();
    }

    function test_Seeds_ReturnsCorrectSeed() public {
        vm.prank(minter);
        uint256 tokenId = token.mint();

        IAnonsSeeder.Seed memory seed = token.seeds(tokenId);
        // Token 1 is odd, so should be dusk
        assertTrue(seed.isDusk, "Token 1 should be dusk cycle");
    }

    function test_Seeds_RevertsForNonexistent() public {
        vm.expectRevert(AnonsToken.NonExistentToken.selector);
        token.seeds(999);
    }

    function test_TokenURI_ReturnsValidURI() public view {
        string memory uri = token.tokenURI(0);
        assertTrue(bytes(uri).length > 0, "Token URI should not be empty");
    }

    function test_TokenURI_RevertsForNonexistent() public {
        vm.expectRevert(AnonsToken.NonExistentToken.selector);
        token.tokenURI(999);
    }

    function test_Burn_ByOwner() public {
        vm.prank(clawdia);
        token.burn(0);

        vm.expectRevert();
        token.ownerOf(0);
    }

    function test_Burn_RevertsIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        token.burn(0);
    }

    function test_SetMinter_OnlyOwner() public {
        address newMinter = address(0x9999);
        token.setMinter(newMinter);
        assertEq(token.minter(), newMinter);
    }

    function test_SetMinter_RevertsIfLocked() public {
        token.lockMinter();
        vm.expectRevert(AnonsToken.MinterIsLocked.selector);
        token.setMinter(address(0x9999));
    }

    function test_LockMinter() public {
        assertFalse(token.isMinterLocked());
        token.lockMinter();
        assertTrue(token.isMinterLocked());
    }

    function test_SetDescriptor_OnlyOwner() public {
        AnonsDescriptor newDescriptor = new AnonsDescriptor();
        token.setDescriptor(newDescriptor);
        assertEq(address(token.descriptor()), address(newDescriptor));
    }

    function test_SetDescriptor_RevertsIfLocked() public {
        token.lockDescriptor();
        vm.expectRevert(AnonsToken.DescriptorIsLocked.selector);
        token.setDescriptor(descriptor);
    }

    function test_SetSeeder_OnlyOwner() public {
        AnonsSeeder newSeeder = new AnonsSeeder();
        token.setSeeder(newSeeder);
        assertEq(address(token.seeder()), address(newSeeder));
    }

    function test_SetSeeder_RevertsIfLocked() public {
        token.lockSeeder();
        vm.expectRevert(AnonsToken.SeederIsLocked.selector);
        token.setSeeder(seeder);
    }

    function test_Votes_DelegateAndGetVotes() public {
        // Clawdia delegates to self
        vm.prank(clawdia);
        token.delegate(clawdia);

        assertEq(token.getVotes(clawdia), 1, "Clawdia should have 1 vote");
    }

    function test_Votes_TransferUpdatesVotes() public {
        vm.prank(clawdia);
        token.delegate(clawdia);
        assertEq(token.getVotes(clawdia), 1);

        // Transfer token to user
        vm.prank(clawdia);
        token.transferFrom(clawdia, user, 0);

        // User delegates to self
        vm.prank(user);
        token.delegate(user);

        assertEq(token.getVotes(clawdia), 0, "Clawdia should have 0 votes after transfer");
        assertEq(token.getVotes(user), 1, "User should have 1 vote after transfer");
    }
}
