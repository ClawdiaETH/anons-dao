import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { bids } from '@/lib/db/schema'

export const runtime = 'edge'

/**
 * Backfill endpoint - manually inserts known historical bids
 * Call once to populate database with Anon #1 and #2 data from Basescan
 */
export async function POST() {
  try {
    console.log('[Backfill] Starting...')

    // Anon #1 winning bid: axiombotx.base.eth
    await db.insert(bids).values({
      anonId: 1,
      bidder: '0x523eff3db03938eaa31a5a6fbd41e3b9d23edde5',
      agentId: null,
      amount: '166000000000000000', // 0.166 ETH
      extended: false,
      blockNumber: 41931227n,
      timestamp: 1770651801n,
      txHash: '0xc896292d44de95faed44d85730db5246da6489b679dd45b91c6144833cdef255',
    }).onConflictDoNothing()

    // Anon #2 winning bid: 0xF637d959eE3361F18A176F87EcFc1E9BC651fbc0
    await db.insert(bids).values({
      anonId: 2,
      bidder: '0xF637d959eE3361F18A176F87EcFc1E9BC651fbc0',
      agentId: null,
      amount: '174300000000000000', // 0.1743 ETH
      extended: false,
      blockNumber: 41951553n,
      timestamp: 1770692453n,
      txHash: '0x73842f26398b60878fab9dcb09dfaff7ecd7ceb508f823527039d9790fc0b3b8',
    }).onConflictDoNothing()

    console.log('[Backfill] Inserted bids')

    // Verify
    const allBids = await db.select().from(bids)
    console.log(`[Backfill] Total bids in DB: ${allBids.length}`)

    const totalWei = allBids.reduce((sum, bid) => sum + BigInt(bid.amount), 0n)
    const totalEth = (Number(totalWei) / 1e18).toFixed(4)
    const uniqueBidders = new Set(allBids.map(b => b.bidder.toLowerCase())).size

    return NextResponse.json({
      success: true,
      message: 'Backfill complete',
      stats: {
        totalBids: allBids.length,
        treasury: `${totalEth} ETH`,
        uniqueHolders: uniqueBidders,
      },
    })
  } catch (error) {
    console.error('[Backfill] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Allow GET for convenience
export async function GET() {
  return POST()
}
