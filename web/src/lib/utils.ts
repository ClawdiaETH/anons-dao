import { formatEther } from 'viem'

/**
 * Format ETH amount to 5 decimal places max
 */
export function formatEth(value: bigint): string {
  const eth = formatEther(value)
  const num = parseFloat(eth)
  
  // If less than 0.00001, show full precision
  if (num < 0.00001) return eth
  
  // Otherwise truncate to 5 decimals
  return num.toFixed(5)
}
