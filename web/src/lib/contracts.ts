import { Abi } from 'viem'

// Contract addresses from environment
export const AUCTION_HOUSE_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS as `0x${string}` | undefined
export const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}` | undefined
export const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_ADDRESS as `0x${string}` | undefined

// Minimal ABIs for reading contract state
export const auctionHouseABI: Abi = [
  {
    name: 'auction',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'anonId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'bidder', type: 'address' },
          { name: 'settled', type: 'bool' },
          { name: 'isDusk', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'duration',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'reservePrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'AuctionBid',
    type: 'event',
    inputs: [
      { name: 'anonId', type: 'uint256', indexed: true },
      { name: 'bidder', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'extended', type: 'bool', indexed: false },
    ],
  },
] as const

export const tokenABI: Abi = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'seeds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'background', type: 'uint8' },
          { name: 'head', type: 'uint8' },
          { name: 'visor', type: 'uint8' },
          { name: 'antenna', type: 'uint8' },
          { name: 'body', type: 'uint8' },
          { name: 'accessory', type: 'uint8' },
          { name: 'isDusk', type: 'bool' },
        ],
      },
    ],
  },
] as const

export interface Auction {
  anonId: bigint
  amount: bigint
  startTime: bigint
  endTime: bigint
  bidder: `0x${string}`
  settled: boolean
  isDusk: boolean
}

export interface Seed {
  background: number
  head: number      // renamed from chassis
  visor: number     // renamed from eyes
  antenna: number
  body: number
  accessory: number
  isDusk: boolean
}
