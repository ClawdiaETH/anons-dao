import { createConfig, http, fallback } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

/**
 * RPC Configuration
 * Uses multiple fallback RPCs for maximum reliability
 */

// Debug: Log RPC being used (only in browser)
if (typeof window !== 'undefined') {
  console.log('[wagmi] Using fallback RPC configuration with multiple endpoints')
}

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: fallback([
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
      }),
    ], {
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

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || base.id
