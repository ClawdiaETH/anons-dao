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

    // Count unique winning bidders (excluding zero address)
    const uniqueHolders = new Set<string>()
    let treasuryWei = BigInt(0)

    for (const [, { bidder, amount }] of winningBids) {
      if (bidder !== '0x0000000000000000000000000000000000000000') {
        uniqueHolders.add(bidder.toLowerCase())
        treasuryWei += BigInt(amount)
      }
    }

    // Convert to ETH string with 4 decimals
    const treasuryEth = Number(treasuryWei) / 1e18

    return NextResponse.json({
      treasury: treasuryEth.toFixed(4),
      holders: uniqueHolders.size,
    })
  } catch (error) {
    console.error('[API] Stats fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
