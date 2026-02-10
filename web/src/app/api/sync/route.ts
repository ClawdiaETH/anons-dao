import { NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'
import { db } from '@/lib/db/client'
import { auctions, bids } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { AUCTION_HOUSE_ADDRESS, auctionHouseABI, Auction } from '@/lib/contracts'

// Edge runtime for faster execution
export const runtime = 'edge'
export const maxDuration = 60 // Allow up to 60s for initial sync

/**
 * Sync endpoint - fetches latest data from chain and updates DB
 * Call this periodically (every 30-60s) via cron
 */
export async function POST() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    
    const client = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    // 1. Fetch current auction
    const auctionData = await client.readContract({
      address: AUCTION_HOUSE_ADDRESS,
      abi: auctionHouseABI,
      functionName: 'auction',
    })

    const auction = auctionData as unknown as Auction
    
    // Skip if auction hasn't started
    if (!auction || auction.startTime === 0n) {
      return NextResponse.json({ 
        success: false, 
        message: 'Auction not started' 
      })
    }

    const anonId = Number(auction.anonId)

    // 2. Upsert auction to DB
    await db.insert(auctions)
      .values({
        anonId,
        amount: auction.amount.toString(),
        startTime: auction.startTime,
        endTime: auction.endTime,
        bidder: auction.bidder,
        settled: auction.settled,
        isDusk: auction.isDusk,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: auctions.anonId,
        set: {
          amount: auction.amount.toString(),
          bidder: auction.bidder,
          settled: auction.settled,
          updatedAt: new Date(),
        },
      })

    // 3. Fetch bid events for this auction
    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n

    // Check if we already have bids for this auction
    const existingBids = await db.select()
      .from(bids)
      .where(eq(bids.anonId, anonId))
      .orderBy(desc(bids.blockNumber))
      .limit(1)

    const startBlock = existingBids.length > 0 
      ? existingBids[0].blockNumber + 1n
      : fromBlock

    const logs = await client.getLogs({
      address: AUCTION_HOUSE_ADDRESS,
      event: parseAbiItem('event AuctionBid(uint256 indexed anonId, address indexed bidder, uint256 amount, bool extended)'),
      args: { anonId: BigInt(anonId) },
      fromBlock: startBlock,
      toBlock: 'latest',
    })

    // 4. Insert new bids
    let newBidsCount = 0
    for (const log of logs) {
      const block = await client.getBlock({ blockNumber: log.blockNumber })
      
      await db.insert(bids)
        .values({
          anonId,
          bidder: log.args.bidder!,
          agentId: null, // Will be populated later
          amount: log.args.amount!.toString(),
          extended: log.args.extended!,
          blockNumber: log.blockNumber,
          timestamp: block.timestamp,
          txHash: log.transactionHash,
        })
        .onConflictDoNothing()
      
      newBidsCount++
    }

    return NextResponse.json({
      success: true,
      anonId,
      newBidsCount,
      totalBids: await db.select().from(bids).where(eq(bids.anonId, anonId)).then(r => r.length),
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing
export async function GET() {
  return POST()
}
