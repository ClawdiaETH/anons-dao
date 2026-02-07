// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IAnonsAuctionHouse} from "./interfaces/IAnonsAuctionHouse.sol";
import {IAnonsToken} from "./interfaces/IAnonsToken.sol";
import {IERC8004Registry} from "./interfaces/IERC8004Registry.sol";

/// @title AnonsAuctionHouse
/// @notice 12-hour auctions for Anons with ERC-8004 gating
contract AnonsAuctionHouse is IAnonsAuctionHouse, Pausable, ReentrancyGuard, Ownable2Step {
    error NotRegisteredAgent();
    error AuctionNotStarted();
    error AuctionExpired();
    error AuctionNotExpired();
    error BidTooLow();
    error InvalidAnonId();
    error AuctionAlreadySettled();
    error TransferFailed();

    /// @notice The Anons token contract
    IAnonsToken public immutable anons;

    /// @notice The ERC-8004 agent registry
    IERC8004Registry public immutable agentRegistry;

    /// @notice The treasury address (receives 95% of auction proceeds)
    address public treasury;

    /// @notice The creator address (receives 5% of auction proceeds)
    address public creator;

    /// @notice The current auction (private storage)
    Auction private _auction;

    /// @notice The auction duration (12 hours = 43200 seconds)
    uint256 public override duration = 43200;

    /// @notice The time buffer for anti-sniping (5 minutes)
    uint256 public override timeBuffer = 300;

    /// @notice The reserve price (minimum starting bid)
    uint256 public override reservePrice = 0.01 ether;

    /// @notice The minimum bid increment percentage (5%)
    uint8 public override minBidIncrementPercentage = 5;

    /// @notice Treasury split percentage (95%)
    uint256 public constant TREASURY_SPLIT = 95;

    /// @notice Creator split percentage (5%)
    uint256 public constant CREATOR_SPLIT = 5;

    modifier onlyRegisteredAgent() {
        if (agentRegistry.balanceOf(msg.sender) == 0) revert NotRegisteredAgent();
        _;
    }

    constructor(
        IAnonsToken _anons,
        IERC8004Registry _agentRegistry,
        address _treasury,
        address _creator
    ) Ownable(msg.sender) {
        anons = _anons;
        agentRegistry = _agentRegistry;
        treasury = _treasury;
        creator = _creator;

        // Start paused - unpause to start first auction
        _pause();
    }

    /// @inheritdoc IAnonsAuctionHouse
    function auction() external view override returns (Auction memory) {
        return _auction;
    }

    /// @inheritdoc IAnonsAuctionHouse
    function createBid(uint256 anonId) external payable override nonReentrant onlyRegisteredAgent {
        Auction memory currentAuction = _auction;

        if (currentAuction.anonId != anonId) revert InvalidAnonId();
        if (block.timestamp < currentAuction.startTime) revert AuctionNotStarted();
        if (block.timestamp >= currentAuction.endTime) revert AuctionExpired();
        if (msg.value < reservePrice) revert BidTooLow();
        if (
            msg.value < currentAuction.amount + ((currentAuction.amount * minBidIncrementPercentage) / 100)
        ) revert BidTooLow();

        address payable lastBidder = currentAuction.bidder;

        // Refund the last bidder
        if (lastBidder != address(0)) {
            _safeTransferETH(lastBidder, currentAuction.amount);
        }

        _auction.amount = msg.value;
        _auction.bidder = payable(msg.sender);

        // Extend auction if bid is within time buffer of end
        bool extended = currentAuction.endTime - block.timestamp < timeBuffer;
        if (extended) {
            _auction.endTime = block.timestamp + timeBuffer;
            emit AuctionExtended(anonId, _auction.endTime);
        }

        emit AuctionBid(anonId, msg.sender, msg.value, extended);
    }

    /// @inheritdoc IAnonsAuctionHouse
    function settleCurrentAndCreateNewAuction() external override nonReentrant whenNotPaused {
        _settleAuction();
        _createAuction();
    }

    /// @inheritdoc IAnonsAuctionHouse
    function settleAuction() external override nonReentrant whenPaused {
        _settleAuction();
    }

    /// @inheritdoc IAnonsAuctionHouse
    function pause() external override onlyOwner {
        _pause();
    }

    /// @inheritdoc IAnonsAuctionHouse
    function unpause() external override onlyOwner {
        _unpause();

        // If this is the first auction or previous was settled, create new
        if (_auction.startTime == 0 || _auction.settled) {
            _createAuction();
        }
    }

    /// @inheritdoc IAnonsAuctionHouse
    function setTimeBuffer(uint256 _timeBuffer) external override onlyOwner {
        timeBuffer = _timeBuffer;
        emit TimeBufferUpdated(_timeBuffer);
    }

    /// @inheritdoc IAnonsAuctionHouse
    function setReservePrice(uint256 _reservePrice) external override onlyOwner {
        reservePrice = _reservePrice;
        emit ReservePriceUpdated(_reservePrice);
    }

    /// @inheritdoc IAnonsAuctionHouse
    function setMinBidIncrementPercentage(uint8 _minBidIncrementPercentage) external override onlyOwner {
        minBidIncrementPercentage = _minBidIncrementPercentage;
        emit MinBidIncrementPercentageUpdated(_minBidIncrementPercentage);
    }

    /// @inheritdoc IAnonsAuctionHouse
    function setDuration(uint256 _duration) external override onlyOwner {
        duration = _duration;
        emit DurationUpdated(_duration);
    }

    /// @notice Sets the treasury address
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    /// @notice Sets the creator address
    function setCreator(address _creator) external onlyOwner {
        creator = _creator;
    }

    /// @notice Internal function to create a new auction
    function _createAuction() internal {
        uint256 tokenId = anons.mint();
        bool isDusk = tokenId % 2 == 1;

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        _auction = Auction({
            anonId: tokenId,
            amount: 0,
            startTime: startTime,
            endTime: endTime,
            bidder: payable(address(0)),
            settled: false,
            isDusk: isDusk
        });

        emit AuctionCreated(tokenId, startTime, endTime, isDusk);
    }

    /// @notice Internal function to settle the current auction
    function _settleAuction() internal {
        Auction memory currentAuction = _auction;

        if (currentAuction.startTime == 0) revert AuctionNotStarted();
        if (currentAuction.settled) revert AuctionAlreadySettled();
        if (block.timestamp < currentAuction.endTime) revert AuctionNotExpired();

        _auction.settled = true;

        if (currentAuction.bidder == address(0)) {
            // No bids - send to creator (Clawdia)
            anons.transferFrom(address(this), creator, currentAuction.anonId);
        } else {
            // Transfer token to winner
            anons.transferFrom(address(this), currentAuction.bidder, currentAuction.anonId);

            // Split proceeds
            if (currentAuction.amount > 0) {
                uint256 treasuryAmount = (currentAuction.amount * TREASURY_SPLIT) / 100;
                uint256 creatorAmount = currentAuction.amount - treasuryAmount;

                _safeTransferETH(treasury, treasuryAmount);
                _safeTransferETH(creator, creatorAmount);

                emit AuctionSettled(
                    currentAuction.anonId,
                    currentAuction.bidder,
                    currentAuction.amount,
                    treasuryAmount,
                    creatorAmount
                );
            }
        }
    }

    /// @notice Safely transfers ETH to an address
    function _safeTransferETH(address to, uint256 amount) internal {
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Allows the contract to receive the minted token
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
