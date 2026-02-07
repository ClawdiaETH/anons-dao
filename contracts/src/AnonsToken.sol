// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721Votes} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IAnonsToken} from "./interfaces/IAnonsToken.sol";
import {IAnonsDescriptor} from "./interfaces/IAnonsDescriptor.sol";
import {IAnonsSeeder} from "./interfaces/IAnonsSeeder.sol";

/// @title AnonsToken
/// @notice ERC-721 token with voting capabilities for the Anons DAO
contract AnonsToken is IAnonsToken, ERC721Enumerable, ERC721Votes, Ownable2Step {
    error MinterIsLocked();
    error DescriptorIsLocked();
    error SeederIsLocked();
    error OnlyMinter();
    error NonExistentToken();

    /// @notice The address that can mint new tokens
    address public override minter;

    /// @notice The descriptor contract for generating token URIs
    IAnonsDescriptor public override descriptor;

    /// @notice The seeder contract for generating random seeds
    IAnonsSeeder public override seeder;

    /// @notice Whether the minter can be updated
    bool public isMinterLocked;

    /// @notice Whether the descriptor can be updated
    bool public isDescriptorLocked;

    /// @notice Whether the seeder can be updated
    bool public isSeederLocked;

    /// @notice The token ID counter (starts at 0)
    uint256 private _currentTokenId;

    /// @notice Mapping of token ID to seed
    mapping(uint256 => IAnonsSeeder.Seed) private _seeds;

    modifier onlyMinter() {
        if (msg.sender != minter) revert OnlyMinter();
        _;
    }

    constructor(
        address _clawdia,
        IAnonsDescriptor _descriptor,
        IAnonsSeeder _seeder,
        IAnonsSeeder.Seed memory _clawdiaSeed
    ) ERC721("Anons", "ANON") EIP712("Anons", "1") Ownable(msg.sender) {
        descriptor = _descriptor;
        seeder = _seeder;

        // Mint token #0 to Clawdia with custom seed
        _mintToWithSeed(_clawdia, 0, _clawdiaSeed);
    }

    /// @inheritdoc IAnonsToken
    function mint() external override onlyMinter returns (uint256) {
        _currentTokenId++;
        return _mintTo(minter, _currentTokenId);
    }

    /// @notice Internal mint function with random seed
    function _mintTo(address to, uint256 tokenId) internal returns (uint256) {
        IAnonsSeeder.Seed memory seed = seeder.generateSeed(tokenId, descriptor);
        return _mintToWithSeed(to, tokenId, seed);
    }

    /// @notice Internal mint function with custom seed (used for Clawdia's token #0)
    function _mintToWithSeed(address to, uint256 tokenId, IAnonsSeeder.Seed memory seed) internal returns (uint256) {
        _seeds[tokenId] = seed;

        _mint(to, tokenId);
        emit AnonCreated(tokenId, seed);

        return tokenId;
    }

    /// @inheritdoc IAnonsToken
    function burn(uint256 tokenId) external override {
        if (!_isAuthorized(ownerOf(tokenId), msg.sender, tokenId)) revert ERC721InvalidOwner(msg.sender);
        _burn(tokenId);
    }

    /// @inheritdoc IAnonsToken
    function seeds(uint256 tokenId) external view override returns (IAnonsSeeder.Seed memory) {
        if (_ownerOf(tokenId) == address(0)) revert NonExistentToken();
        return _seeds[tokenId];
    }

    /// @inheritdoc IAnonsToken
    function setMinter(address _minter) external override onlyOwner {
        if (isMinterLocked) revert MinterIsLocked();
        minter = _minter;
        emit MinterUpdated(_minter);
    }

    /// @inheritdoc IAnonsToken
    function lockMinter() external override onlyOwner {
        isMinterLocked = true;
        emit MinterLocked();
    }

    /// @inheritdoc IAnonsToken
    function setDescriptor(IAnonsDescriptor _descriptor) external override onlyOwner {
        if (isDescriptorLocked) revert DescriptorIsLocked();
        descriptor = _descriptor;
        emit DescriptorUpdated(_descriptor);
    }

    /// @inheritdoc IAnonsToken
    function lockDescriptor() external override onlyOwner {
        isDescriptorLocked = true;
        emit DescriptorLocked();
    }

    /// @inheritdoc IAnonsToken
    function setSeeder(IAnonsSeeder _seeder) external override onlyOwner {
        if (isSeederLocked) revert SeederIsLocked();
        seeder = _seeder;
        emit SeederUpdated(_seeder);
    }

    /// @inheritdoc IAnonsToken
    function lockSeeder() external override onlyOwner {
        isSeederLocked = true;
        emit SeederLocked();
    }

    /// @notice Returns the token URI for a given token
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NonExistentToken();
        return descriptor.tokenURI(tokenId, _seeds[tokenId]);
    }

    // Required overrides for multiple inheritance

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Enumerable, ERC721Votes)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
