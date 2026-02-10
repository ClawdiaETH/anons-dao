import { formatEther } from 'viem'
import { Seed } from './contracts'

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

/**
 * Background colors from the contract
 * Dawn = indices 0-1, Dusk = indices 2-3
 */
const BACKGROUNDS = [
  '#e1d7d5', // 0: Dawn Sky
  '#f5e6d3', // 1: Dawn Clouds
  '#d5d7e1', // 2: Dusk Sky
  '#d5e1e1', // 3: Dusk Clouds
]

/**
 * Get the background color for an Anon based on its seed
 */
export function getBackgroundColor(seed: Seed): string {
  const half = BACKGROUNDS.length / 2
  if (seed.isDusk) {
    return BACKGROUNDS[half + (seed.background % half)]
  } else {
    return BACKGROUNDS[seed.background % half]
  }
}
