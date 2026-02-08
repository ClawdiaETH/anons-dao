import { Abi } from 'viem'

// Contract addresses (Base Mainnet)
// Deployed: 2026-02-08
export const AUCTION_HOUSE_ADDRESS = '0x66B49eC609E3c4ccEbeA9Ff102Cab9dB4BED66d3' as `0x${string}`
export const TOKEN_ADDRESS = '0xa50267bA8c00439014794f8f2F5c3C6D38865975' as `0x${string}`
export const DAO_ADDRESS = '0x5498bCF9efE4C021c0e4CF8CA62464123A72259c' as `0x${string}`
export const DESCRIPTOR_ADDRESS = '0x878229a901DA76BF7C7D35eBEaC9B42715E9FA05' as `0x${string}`
export const SEEDER_ADDRESS = '0x7C5fd3b7B4948c281a2F24c28291b56e0118c6d8' as `0x${string}`
export const TIMELOCK_ADDRESS = '0x7c415B8962063A23EA21AE310E4D69C87F028F02' as `0x${string}`
export const ERC8004_REGISTRY_ADDRESS = '0x00256C0D814c455425A0699D5eEE2A7DB7A5519c' as `0x${string}`

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
