import { createConfig, http, fallback } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

/**
 * RPC Configuration with fallbacks
 * Multiple endpoints ensure reliability if one fails
 */

// Base Mainnet RPCs (in priority order)
const BASE_RPCS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL, // Custom RPC (if set)
  'https://mainnet.base.org',           // Base official RPC
  'https://base.llamarpc.com',          // LlamaRPC
  'https://base.blockpi.network/v1/rpc/public', // BlockPI
].filter(Boolean) as string[]

// Base Sepolia RPCs (in priority order)
const BASE_SEPOLIA_RPCS = [
  'https://sepolia.base.org',           // Base official RPC
  'https://base-sepolia.blockpi.network/v1/rpc/public', // BlockPI
]

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    // Fallback: tries RPCs in order until one succeeds
    [base.id]: fallback(BASE_RPCS.map(url => http(url))),
    [baseSepolia.id]: fallback(BASE_SEPOLIA_RPCS.map(url => http(url))),
  },
  // Auto-detects injected wallet connectors (MetaMask, etc)
  ssr: true,
})

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || base.id
