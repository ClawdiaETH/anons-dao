// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAnonsAuctionHouse
/// @notice Interface for the AnonsAuctionHouse contract
interface IAnonsAuctionHouse {
    /// @notice Auction struct
    struct Auction {
        uint256 anonId;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        address payable bidder;
        bool settled;
        bool isDusk;
    }

    /// @notice Emitted when a new auction is created
    /// @param anonId The ID of the Anon being auctioned
    /// @param startTime The start time of the auction
    /// @param endTime The end time of the auction
    /// @param isDusk Whether this is a dusk (true) or dawn (false) auction
    event AuctionCreated(uint256 indexed anonId, uint256 startTime, uint256 endTime, bool isDusk);

    /// @notice Emitted when a bid is placed
    /// @param anonId The ID of the Anon being bid on
    /// @param bidder The address of the bidder
    /// @param amount The bid amount
    /// @param extended Whether the auction was extended due to anti-sniping
    event AuctionBid(uint256 indexed anonId, address indexed bidder, uint256 amount, bool extended);

    /// @notice Emitted when an auction is extended
    /// @param anonId The ID of the Anon
    /// @param endTime The new end time
    event AuctionExtended(uint256 indexed anonId, uint256 endTime);

    /// @notice Emitted when an auction is settled
    /// @param anonId The ID of the Anon
    /// @param winner The address of the winner
    /// @param amount The winning bid amount
    /// @param treasuryAmount The amount sent to treasury
    /// @param creatorAmount The amount sent to creator
    event AuctionSettled(
        uint256 indexed anonId,
        address indexed winner,
        uint256 amount,
        uint256 treasuryAmount,
        uint256 creatorAmount
    );

    /// @notice Emitted when the time buffer is updated
    /// @param timeBuffer The new time buffer
    event TimeBufferUpdated(uint256 timeBuffer);

    /// @notice Emitted when the reserve price is updated
    /// @param reservePrice The new reserve price
    event ReservePriceUpdated(uint256 reservePrice);

    /// @notice Emitted when the minimum bid increment percentage is updated
    /// @param minBidIncrementPercentage The new minimum bid increment percentage
    event MinBidIncrementPercentageUpdated(uint256 minBidIncrementPercentage);

    /// @notice Emitted when the duration is updated
    /// @param duration The new duration
    event DurationUpdated(uint256 duration);

    /// @notice Creates a bid for the current Anon
    /// @param anonId The ID of the Anon to bid on (for verification)
    function createBid(uint256 anonId) external payable;

    /// @notice Settles the current auction and starts a new one
    function settleCurrentAndCreateNewAuction() external;

    /// @notice Settles the current auction
    function settleAuction() external;

    /// @notice Pauses the auction house
    function pause() external;

    /// @notice Unpauses the auction house and starts a new auction
    function unpause() external;

    /// @notice Sets the time buffer for anti-sniping
    /// @param timeBuffer The new time buffer in seconds
    function setTimeBuffer(uint256 timeBuffer) external;

    /// @notice Sets the reserve price
    /// @param reservePrice The new reserve price
    function setReservePrice(uint256 reservePrice) external;

    /// @notice Sets the minimum bid increment percentage
    /// @param minBidIncrementPercentage The new minimum bid increment percentage
    function setMinBidIncrementPercentage(uint8 minBidIncrementPercentage) external;

    /// @notice Sets the auction duration
    /// @param duration The new duration in seconds
    function setDuration(uint256 duration) external;

    /// @notice Returns the current auction
    function auction() external view returns (Auction memory);

    /// @notice Returns the auction duration
    function duration() external view returns (uint256);

    /// @notice Returns the time buffer for anti-sniping
    function timeBuffer() external view returns (uint256);

    /// @notice Returns the reserve price
    function reservePrice() external view returns (uint256);

    /// @notice Returns the minimum bid increment percentage
    function minBidIncrementPercentage() external view returns (uint8);
}
