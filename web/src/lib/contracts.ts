// Contract addresses on Base mainnet
export const ANONS_AUCTION_HOUSE = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F' as const
export const ANONS_TOKEN = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686' as const
export const ERC8004_REGISTRY = '0x00256C0D814c455425A0699D5eEE2A7DB7A5519c' as const

// Minimal ABI for createBid function
export const AUCTION_HOUSE_ABI = [
  {
    name: 'createBid',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'anonId', type: 'uint256' }
    ],
    outputs: []
  }
] as const

// ERC-8004 Registry ABI (balanceOf to check registration)
export const ERC8004_REGISTRY_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  }
] as const
