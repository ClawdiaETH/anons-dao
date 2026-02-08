/**
 * Chain validation utilities for Anons DAO
 * Ensures users are on the correct network before interacting with contracts
 */

import { base, baseSepolia } from 'wagmi/chains'

// Expected chain ID from environment (defaults to Base mainnet)
export const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || base.id

// Supported chains
export const SUPPORTED_CHAINS = [base, baseSepolia] as const
export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(c => c.id)

/**
 * Validate that the connected chain matches the expected chain
 * @param chainId - Currently connected chain ID
 * @throws Error if chain is incorrect
 */
export function validateChainId(chainId: number | undefined): void {
  if (!chainId) {
    throw new Error('No chain connected. Please connect your wallet.')
  }

  if (chainId !== EXPECTED_CHAIN_ID) {
    const expectedChainName = EXPECTED_CHAIN_ID === base.id ? 'Base' : 'Base Sepolia'
    const currentChainName = chainId === base.id ? 'Base' : 
                             chainId === baseSepolia.id ? 'Base Sepolia' : 
                             `Unknown (${chainId})`
    
    throw new Error(
      `Wrong network! Expected ${expectedChainName} (${EXPECTED_CHAIN_ID}), but connected to ${currentChainName} (${chainId}). Please switch networks in your wallet.`
    )
  }
}

/**
 * Check if a chain ID is supported
 * @param chainId - Chain ID to check
 * @returns true if supported, false otherwise
 */
export function isSupportedChain(chainId: number | undefined): boolean {
  return chainId !== undefined && (SUPPORTED_CHAIN_IDS as readonly number[]).includes(chainId)
}

/**
 * Get human-readable chain name
 * @param chainId - Chain ID
 * @returns Chain name or "Unknown"
 */
export function getChainName(chainId: number | undefined): string {
  if (!chainId) return 'Unknown'
  
  switch (chainId) {
    case base.id:
      return 'Base'
    case baseSepolia.id:
      return 'Base Sepolia'
    default:
      return `Unknown (${chainId})`
  }
}
