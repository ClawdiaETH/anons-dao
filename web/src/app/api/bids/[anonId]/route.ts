import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'
import { db } from '@/lib/db/client'
import { bids } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

const AUCTION_HOUSE_ADDRESS = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F' as const
const DEPLOYMENT_BLOCK = 41908459n

// Enable Edge Runtime for faster cold starts
export const runtime = 'edge'

// Cache for 5 seconds (DB is updated every 30s via sync)
export const revalidate = 5

export async function GET(
  request: NextRequest,
  { params }: { params: { anonId: string } }
) {
  try {
    const anonId = parseInt(params.anonId)
    
    // Try database first (fast path)
    const bidRecords = await db.select({
      bidder: bids.bidder,
      amount: bids.amount,
      extended: bids.extended,
      timestamp: bids.timestamp,
      blockNumber: bids.blockNumber,
      agentId: bids.agentId,
    })
      .from(bids)
      .where(eq(bids.anonId, anonId))
      .orderBy(desc(bids.blockNumber))

    // If DB has bids, use them (10-100x faster!)
    if (bidRecords.length > 0) {
      const formattedBids = bidRecords.map(bid => ({
        bidder: bid.bidder,
        amount: bid.amount,
        extended: bid.extended,
        timestamp: Number(bid.timestamp),
        blockNumber: bid.blockNumber.toString(),
        agentId: bid.agentId || undefined,
      }))

      return NextResponse.json({ bids: formattedBids }, {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        },
      })
    }

    // Fallback to RPC if DB is empty (slower but works)
    console.log('[FALLBACK] DB empty, querying RPC for anonId:', anonId)
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    
    const client = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const logs = await client.getLogs({
      address: AUCTION_HOUSE_ADDRESS,
      event: parseAbiItem('event AuctionBid(uint256 indexed anonId, address indexed bidder, uint256 amount, bool extended)'),
      args: { anonId: BigInt(anonId) },
      fromBlock: DEPLOYMENT_BLOCK,
      toBlock: 'latest',
    })

    const rpcBids = await Promise.all(
      logs.map(async (log) => {
        const block = await client.getBlock({ blockNumber: log.blockNumber })
        return {
          bidder: log.args.bidder!,
          amount: log.args.amount?.toString()!,
          extended: log.args.extended!,
          timestamp: Number(block.timestamp),
          blockNumber: log.blockNumber.toString(),
        }
      })
    )

    // Sort by block number descending
    rpcBids.sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)))

    return NextResponse.json({ bids: rpcBids }, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}
