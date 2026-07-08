// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BaseMiniAuction {
    uint256 public constant MIN_DURATION = 5 minutes;
    uint256 public constant MAX_DURATION = 14 days;
    uint256 public nextAuctionId = 1;

    struct Auction {
        address seller;
        uint256 startingBid;
        uint256 highestBid;
        address highestBidder;
        uint256 endsAt;
        bool settled;
        string itemName;
        string itemNote;
    }

    mapping(uint256 => Auction) private auctions;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 startingBid,
        uint256 endsAt,
        string itemName,
        string itemNote
    );
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionSettled(uint256 indexed auctionId, address indexed seller, address indexed winner, uint256 amount);

    function createAuction(
        string calldata itemName,
        string calldata itemNote,
        uint256 startingBid,
        uint256 durationSeconds
    ) external returns (uint256 auctionId) {
        require(bytes(itemName).length > 0 && bytes(itemName).length <= 40, "Invalid item name");
        require(bytes(itemNote).length <= 120, "Item note too long");
        require(startingBid > 0, "Starting bid required");
        require(durationSeconds >= MIN_DURATION && durationSeconds <= MAX_DURATION, "Invalid duration");

        auctionId = nextAuctionId++;
        auctions[auctionId] = Auction({
            seller: msg.sender,
            startingBid: startingBid,
            highestBid: 0,
            highestBidder: address(0),
            endsAt: block.timestamp + durationSeconds,
            settled: false,
            itemName: itemName,
            itemNote: itemNote
        });

        emit AuctionCreated(
            auctionId,
            msg.sender,
            startingBid,
            block.timestamp + durationSeconds,
            itemName,
            itemNote
        );
    }

    function placeBid(uint256 auctionId) external payable {
        Auction storage auction = auctions[auctionId];
        require(auction.seller != address(0), "Auction not found");
        require(block.timestamp < auction.endsAt, "Auction ended");
        require(!auction.settled, "Auction settled");

        uint256 minimumBid = auction.highestBid == 0
            ? auction.startingBid
            : auction.highestBid + (auction.highestBid / 20) + 1;
        require(msg.value >= minimumBid, "Bid too low");

        if (auction.highestBidder != address(0)) {
            (bool refunded, ) = payable(auction.highestBidder).call{value: auction.highestBid}("");
            require(refunded, "Refund failed");
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    function settleAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(auction.seller != address(0), "Auction not found");
        require(block.timestamp >= auction.endsAt, "Auction still active");
        require(!auction.settled, "Auction settled");

        auction.settled = true;

        if (auction.highestBidder != address(0) && auction.highestBid > 0) {
            (bool paid, ) = payable(auction.seller).call{value: auction.highestBid}("");
            require(paid, "Payout failed");
        }

        emit AuctionSettled(
            auctionId,
            auction.seller,
            auction.highestBidder,
            auction.highestBid
        );
    }

    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }
}
