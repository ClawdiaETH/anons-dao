import { Abi } from 'viem'

// Contract addresses (Base Mainnet)
// Deployed: 2026-02-08 via DeployNoTraits.s.sol
export const TOKEN_ADDRESS = '0x813d1d56457bd4697abedb835435691b187eedc4' as `0x${string}`
export const DESCRIPTOR_ADDRESS = '0xc45f4894f769602e1fdc888c935b294188a98064' as `0x${string}`
export const SEEDER_ADDRESS = '0x3a62109ccad858907a5750b906618ea7b433d3a3' as `0x${string}`
export const AUCTION_HOUSE_ADDRESS = '0x7c5fd3b7b4948c281a2f24c28291b56e0118c6d8' as `0x${string}`
export const TIMELOCK_ADDRESS = '0xc6a182c0693726e01d1963c0dd5eb8368d9e8728' as `0x${string}`
export const DAO_ADDRESS = '0xb86da1a24f93c6fb1027762909e1e11f8b1f3851' as `0x${string}`
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
