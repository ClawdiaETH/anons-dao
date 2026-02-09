// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IAnonsAuctionHouse} from "./interfaces/IAnonsAuctionHouse.sol";
import {IAnonsToken} from "./interfaces/IAnonsToken.sol";
import {IERC8004Registry} from "./interfaces/IERC8004Registry.sol";
import {IWETH} from "./interfaces/IWETH.sol";

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

    /// @notice WETH contract for fallback transfers
    IWETH public immutable weth;

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
        IWETH _weth,
        address _treasury,
        address _creator
    ) Ownable(msg.sender) {
        anons = _anons;
        agentRegistry = _agentRegistry;
        weth = _weth;
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

        // CHECKS: Validate auction state and bid amount
        if (currentAuction.anonId != anonId) revert InvalidAnonId();
        if (block.timestamp < currentAuction.startTime) revert AuctionNotStarted();
        if (block.timestamp >= currentAuction.endTime) revert AuctionExpired();
        if (msg.value < reservePrice) revert BidTooLow();
        if (
            msg.value < currentAuction.amount + ((currentAuction.amount * minBidIncrementPercentage) / 100)
        ) revert BidTooLow();

        address payable lastBidder = currentAuction.bidder;
        uint256 lastBidAmount = currentAuction.amount;

        // EFFECTS: Update state before external calls (CEI pattern)
        _auction.amount = msg.value;
        _auction.bidder = payable(msg.sender);

        // Extend auction if bid is within time buffer of end
        bool extended = currentAuction.endTime - block.timestamp < timeBuffer;
        if (extended) {
            _auction.endTime = block.timestamp + timeBuffer;
            emit AuctionExtended(anonId, _auction.endTime);
        }

        emit AuctionBid(anonId, msg.sender, msg.value, extended);

        // INTERACTIONS: Refund the last bidder after state is updated
        if (lastBidder != address(0)) {
            _safeTransferETH(lastBidder, lastBidAmount);
        }
    }

    /// @inheritdoc IAnonsAuctionHouse
    function settleCurrentAndCreateNewAuction() external override nonReentrant whenNotPaused onlyRegisteredAgent {
        // CEI Pattern: Settle old auction (has external calls), then create new one
        // _settleAuction() sets _auction.settled = true before external calls,
        // preventing reentrancy attacks on the old auction
        _settleAuction();
        
        // Mint new token (external call to trusted contract)
        uint256 newTokenId = anons.mint();
        
        // EFFECTS: Create new auction with minted token (no more external calls)
        _createAuctionWithToken(newTokenId);
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
            // Mint token first (external call to trusted contract)
            uint256 newTokenId = anons.mint();
            // Then create auction with minted token (follows CEI pattern)
            _createAuctionWithToken(newTokenId);
        }
    }

    /// @inheritdoc IAnonsAuctionHouse
    function setTimeBuffer(uint256 _timeBuffer) external override onlyOwner {
        require(_timeBuffer <= 1 hours, "Time buffer too high");
        timeBuffer = _timeBuffer;
        emit TimeBufferUpdated(_timeBuffer);
    }

    /// @inheritdoc IAnonsAuctionHouse
    function setReservePrice(uint256 _reservePrice) external override onlyOwner {
        require(_reservePrice <= 1000 ether, "Reserve price too high");
        reservePrice = _reservePrice;
        emit ReservePriceUpdated(_reservePrice);
    }

    /// @inheritdoc IAnonsAuctionHouse
    function setMinBidIncrementPercentage(uint8 _minBidIncrementPercentage) external override onlyOwner {
        require(_minBidIncrementPercentage >= 1 && _minBidIncrementPercentage <= 50, "Bid increment out of bounds");
        minBidIncrementPercentage = _minBidIncrementPercentage;
        emit MinBidIncrementPercentageUpdated(_minBidIncrementPercentage);
    }

    /// @inheritdoc IAnonsAuctionHouse
    function setDuration(uint256 _duration) external override onlyOwner {
        require(_duration >= 1 hours && _duration <= 7 days, "Duration out of bounds");
        duration = _duration;
        emit DurationUpdated(_duration);
    }

    /// @notice Sets the treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Treasury cannot be zero address");
        treasury = _treasury;
    }

    /// @notice Sets the creator address
    function setCreator(address _creator) external onlyOwner {
        require(_creator != address(0), "Creator cannot be zero address");
        creator = _creator;
    }

    /// @notice Internal function to create a new auction with a pre-minted token
    /// @dev Refactored to accept tokenId parameter to follow CEI pattern
    /// @param tokenId The ID of the pre-minted Anon token
    function _createAuctionWithToken(uint256 tokenId) internal {
        bool isDusk = tokenId % 2 == 1;

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        // EFFECTS: Write all state before any external calls
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

        // EFFECTS: Mark auction as settled first
        _auction.settled = true;

        if (currentAuction.bidder == address(0)) {
            // No bids - send to creator (Clawdia)
            anons.transferFrom(address(this), creator, currentAuction.anonId);
        } else {
            // INTERACTIONS: Transfer ETH BEFORE NFT (follows CEI pattern)
            // This prevents bricking if treasury/creator reverts on ETH receipt
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

            // Transfer NFT LAST (after ETH distribution)
            // This ensures ETH transfers complete before triggering recipient callbacks
            anons.transferFrom(address(this), currentAuction.bidder, currentAuction.anonId);
        }
    }

    /// @notice Safely transfers ETH to an address, with WETH fallback
    /// @dev If ETH transfer fails, wraps to WETH and sends that instead
    /// @param to The recipient address
    /// @param amount The amount to transfer
    function _safeTransferETH(address to, uint256 amount) internal {
        (bool success,) = to.call{value: amount}("");
        
        // If ETH transfer fails, wrap to WETH and send that
        if (!success) {
            weth.deposit{value: amount}();
            bool wethSuccess = weth.transfer(to, amount);
            if (!wethSuccess) revert TransferFailed();
        }
    }

    /// @notice Allows the contract to receive the minted token
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
