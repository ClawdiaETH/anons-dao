import { createConfig, http, fallback } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

/**
 * RPC Configuration
 * Uses multiple fallback RPCs for maximum reliability
 */

// Alchemy RPC from env (if set)
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL

// Build RPC array with Alchemy first (if available)
const buildBaseRpcs = () => {
  const rpcs = []
  
  if (ALCHEMY_RPC) {
    rpcs.push(http(ALCHEMY_RPC, {
      batch: false,
      retryCount: 3,
      timeout: 10_000,
    }))
  }
  
  rpcs.push(
    http('https://mainnet.base.org', {
      batch: false,
      retryCount: 2,
      timeout: 8_000,
    }),
    http('https://base.gateway.tenderly.co', {
      batch: false,
      retryCount: 2,
      timeout: 8_000,
    }),
    http('https://base-rpc.publicnode.com', {
      batch: false,
      retryCount: 2,
      timeout: 8_000,
    }),
    http('https://1rpc.io/base', {
      batch: false,
      retryCount: 2,
      timeout: 8_000,
    })
  )
  
  return rpcs
}

// Debug: Log RPC being used (only in browser)
if (typeof window !== 'undefined') {
  console.log('[wagmi] Using fallback RPC configuration:', ALCHEMY_RPC ? 'Alchemy + public' : 'public only')
}

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: fallback(buildBaseRpcs(), {
      rank: true, // Auto-rank RPCs by performance
    }),
    [baseSepolia.id]: http('https://sepolia.base.org', {
      batch: false,
      retryCount: 3,
      timeout: 10_000,
    }),
  },
  // Auto-detects injected wallet connectors (MetaMask, etc)
  ssr: true,
})

// HARDCODED TO BASE MAINNET (8453) - all contracts deployed here
export const CHAIN_ID = base.id
