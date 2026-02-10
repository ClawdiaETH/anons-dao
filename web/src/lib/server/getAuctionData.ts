import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { AUCTION_HOUSE_ADDRESS, auctionHouseABI, Auction } from '../contracts'

/**
 * Server-side auction data fetching
 * This provides initial data for SSR, client hooks take over after hydration
 */
export async function getAuctionData(): Promise<{
  auction: Auction | null
  error: string | null
}> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    
    const client = createPublicClient({
      chain: base,
      transport: http(rpcUrl, {
        timeout: 5000, // 5s timeout
      }),
    })

    const auctionData = await client.readContract({
      address: AUCTION_HOUSE_ADDRESS,
      abi: auctionHouseABI,
      functionName: 'auction',
    })

    // Type assertion - we know the structure from the ABI
    const auction = auctionData as unknown as Auction

    // Validate we got real data (not uninitialized auction)
    if (!auction || auction.startTime === 0n) {
      return { auction: null, error: 'Auction not started' }
    }

    return { auction, error: null }
  } catch (error) {
    console.error('[SSR] Failed to fetch auction:', error)
    return { 
      auction: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
