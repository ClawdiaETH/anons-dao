import { Abi } from 'viem'

// Contract addresses (Base Mainnet - v2 SECURITY FIXED)
// Deployed: 2026-02-08 20:15 CST via DeployNoTraits.s.sol
// Security fixes: Dynamic quorum, veto mechanism, parameter bounds
export const TOKEN_ADDRESS = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686' as `0x${string}`
export const DESCRIPTOR_ADDRESS = '0x7A6ebCD98381bB736F2451eb205e1cfD86bb6b9e' as `0x${string}`
export const SEEDER_ADDRESS = '0xDFb06e78e517C46f071aef418d0181FfeAe84E2A' as `0x${string}`
export const AUCTION_HOUSE_ADDRESS = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F' as `0x${string}`
export const TIMELOCK_ADDRESS = '0x167b2f7Ce609Bf0117A148e6460A4Ca943f6dF32' as `0x${string}`
export const DAO_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B' as `0x${string}`
export const ERC8004_REGISTRY_ADDRESS = '0x00256C0D814c455425A0699D5eEE2A7DB7A5519c' as `0x${string}`

// Minimal ABIs for reading contract state
export const auctionHouseABI = [
  {
    name: 'auction',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IAnonsAuctionHouse.Auction',
        components: [
          { name: 'anonId', type: 'uint256', internalType: 'uint256' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'startTime', type: 'uint256', internalType: 'uint256' },
          { name: 'endTime', type: 'uint256', internalType: 'uint256' },
          { name: 'bidder', type: 'address', internalType: 'address payable' },
          { name: 'settled', type: 'bool', internalType: 'bool' },
          { name: 'isDusk', type: 'bool', internalType: 'bool' },
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

export const tokenABI = [
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
