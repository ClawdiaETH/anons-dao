import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { bids } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'
export const revalidate = 0

export async function GET() {
  try {
    // Simple query - just get all bids like backfill does
    const allBids = await db.select().from(bids)

    console.log(`[Stats API] Found ${allBids.length} bids`)

    if (allBids.length === 0) {
      return NextResponse.json({
        treasury: '0.0000',
        holders: 0,
      })
    }

    // Group by anonId to find winning bid (latest timestamp for each anon)
    const winningBids = new Map<number, { bidder: string; amount: string }>()
    const sortedBids = [...allBids].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    
    for (const bid of sortedBids) {
      if (!winningBids.has(bid.anonId)) {
        winningBids.set(bid.anonId, {
          bidder: bid.bidder,
          amount: bid.amount,
        })
      }
    }

    // Calculate treasury and holders
    const uniqueHolders = new Set<string>()
    let treasuryWei = BigInt(0)

    for (const [, { bidder, amount }] of winningBids) {
      if (bidder !== '0x0000000000000000000000000000000000000000') {
        uniqueHolders.add(bidder.toLowerCase())
        treasuryWei += BigInt(amount)
      }
    }

    const treasuryEth = (Number(treasuryWei) / 1e18).toFixed(4)

    console.log('[Stats API] Treasury:', treasuryEth, 'Holders:', uniqueHolders.size)

    return NextResponse.json({
      treasury: treasuryEth,
      holders: uniqueHolders.size,
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    console.error('[API] Stats fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
