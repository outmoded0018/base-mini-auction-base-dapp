import type { Address } from "viem";

export const MAX_ITEM_NAME_LENGTH = 40;
export const MAX_ITEM_NOTE_LENGTH = 120;

export const miniAuctionAbi = [
  {
    type: "function",
    name: "createAuction",
    stateMutability: "nonpayable",
    inputs: [
      { name: "itemName", type: "string" },
      { name: "itemNote", type: "string" },
      { name: "startingBid", type: "uint256" },
      { name: "durationSeconds", type: "uint256" },
    ],
    outputs: [{ name: "auctionId", type: "uint256" }],
  },
  {
    type: "function",
    name: "placeBid",
    stateMutability: "payable",
    inputs: [{ name: "auctionId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settleAuction",
    stateMutability: "nonpayable",
    inputs: [{ name: "auctionId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getAuction",
    stateMutability: "view",
    inputs: [{ name: "auctionId", type: "uint256" }],
    outputs: [
      {
        components: [
          { name: "seller", type: "address" },
          { name: "startingBid", type: "uint256" },
          { name: "highestBid", type: "uint256" },
          { name: "highestBidder", type: "address" },
          { name: "endsAt", type: "uint256" },
          { name: "settled", type: "bool" },
          { name: "itemName", type: "string" },
          { name: "itemNote", type: "string" },
        ],
        name: "",
        type: "tuple",
      },
    ],
  },
] as const;

export type AuctionData = {
  seller: Address;
  startingBid: bigint;
  highestBid: bigint;
  highestBidder: Address;
  endsAt: bigint;
  settled: boolean;
  itemName: string;
  itemNote: string;
};

export const miniAuctionContractAddress = process.env
  .NEXT_PUBLIC_MINI_AUCTION_CONTRACT_ADDRESS as Address | undefined;
