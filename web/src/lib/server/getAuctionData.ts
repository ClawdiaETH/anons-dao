import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { AUCTION_HOUSE_ADDRESS, auctionHouseABI, TOKEN_ADDRESS, tokenABI, Auction, Seed } from '../contracts'

/**
 * Server-side auction data fetching
 * This provides initial data for SSR, client hooks take over after hydration
 */
export async function getAuctionData(): Promise<{
  auction: Auction | null
  seed: Seed | null
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
      return { auction: null, seed: null, error: 'Auction not started' }
    }

    // Fetch seed for the current Anon
    let seed: Seed | null = null
    try {
      const seedData = await client.readContract({
        address: TOKEN_ADDRESS,
        abi: tokenABI,
        functionName: 'seeds',
        args: [auction.anonId],
      })

      // Contract returns tuple: [background, head, visor, antenna, body, accessory, isDusk]
      if (seedData && Array.isArray(seedData)) {
        seed = {
          background: Number(seedData[0]),
          head: Number(seedData[1]),
          visor: Number(seedData[2]),
          antenna: Number(seedData[3]),
          body: Number(seedData[4]),
          accessory: Number(seedData[5]),
          isDusk: Boolean(seedData[6]),
        }
      }
    } catch (seedError) {
      console.error('[SSR] Failed to fetch seed:', seedError)
      // Continue without seed - not critical
    }

    return { auction, seed, error: null }
  } catch (error) {
    console.error('[SSR] Failed to fetch auction:', error)
    return { 
      auction: null,
      seed: null,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
