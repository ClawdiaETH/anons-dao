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

      // viem returns tuple as object with named properties
      if (seedData) {
        seed = {
          background: Number(seedData.background),
          head: Number(seedData.head),
          visor: Number(seedData.visor),
          antenna: Number(seedData.antenna),
          body: Number(seedData.body),
          accessory: Number(seedData.accessory),
          isDusk: Boolean(seedData.isDusk),
        }
        console.log('[SSR] Fetched seed for Anon', auction.anonId.toString(), ':', seed)
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
