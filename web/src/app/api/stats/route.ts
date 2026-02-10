import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { bids } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET() {
  try {
    // Get all bids grouped by anonId, sorted by timestamp desc (winning bid = latest for each anon)
    const allBids = await db
      .select()
      .from(bids)
      .orderBy(desc(bids.timestamp))

    console.log('[Stats API] Found bids:', allBids.length)

    // Group by anonId to find winning bid for each auction
    const winningBids = new Map<number, { bidder: string; amount: string }>()
    for (const bid of allBids) {
      if (!winningBids.has(bid.anonId)) {
        winningBids.set(bid.anonId, {
          bidder: bid.bidder,
          amount: bid.amount,
        })
      }
    }

    console.log('[Stats API] Winning bids:', winningBids.size)

    // Count unique winning bidders (excluding zero address)
    const uniqueHolders = new Set<string>()
    let treasuryWei = BigInt(0)

    for (const [, { bidder, amount }] of winningBids) {
      if (bidder !== '0x0000000000000000000000000000000000000000') {
        uniqueHolders.add(bidder.toLowerCase())
        treasuryWei += BigInt(amount)
      }
    }

    const treasuryEth = Number(treasuryWei) / 1e18

    console.log('[Stats API] Treasury:', treasuryEth, 'Holders:', uniqueHolders.size)

    return NextResponse.json({
      treasury: treasuryEth.toFixed(4),
      holders: uniqueHolders.size,
    })
  } catch (error) {
    console.error('[API] Stats fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
