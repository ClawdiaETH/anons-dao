import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { bids } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

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
    
    // Query database instead of RPC (10-100x faster!)
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

    // Format for frontend compatibility
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
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}
