import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { bids } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'
export const revalidate = 0

const TREASURY_ADDRESS = '0xc44e1FaF399f64a9af523076b8da917427b5bd0b'
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'

export async function GET() {
  try {
    let treasuryEth = '0.0000'

    // Try to query on-chain WETH balance
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: WETH_ADDRESS,
              data: `0x70a08231000000000000000000000000${TREASURY_ADDRESS.slice(2)}`, // balanceOf(treasury)
            },
            'latest',
          ],
        }),
      })

      const data = await response.json()
      if (data.result) {
        const wethBalance = BigInt(data.result)
        treasuryEth = (Number(wethBalance) / 1e18).toFixed(4)
      }
    } catch (rpcError) {
      console.error('[Stats API] RPC call failed, using fallback:', rpcError)
      // Fallback: calculate from database (95% of winning bids)
      const allBids = await db.select().from(bids)
      const winningBids = new Map<number, string>()
      const sortedBids = [...allBids].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      
      for (const bid of sortedBids) {
        if (!winningBids.has(bid.anonId)) {
          winningBids.set(bid.anonId, bid.amount)
        }
      }

      let totalWei = BigInt(0)
      for (const amount of winningBids.values()) {
        totalWei += BigInt(amount)
      }
      
      // Apply 95% treasury split
      const treasuryWei = (totalWei * BigInt(95)) / BigInt(100)
      treasuryEth = (Number(treasuryWei) / 1e18).toFixed(4)
    }

    // Calculate unique holder count from database
    const allBids = await db.select().from(bids)
    
    const winningBids = new Map<number, { bidder: string }>()
    const sortedBids = [...allBids].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    
    for (const bid of sortedBids) {
      if (!winningBids.has(bid.anonId)) {
        winningBids.set(bid.anonId, { bidder: bid.bidder })
      }
    }

    const uniqueHolders = new Set<string>()
    for (const [, { bidder }] of winningBids) {
      if (bidder !== '0x0000000000000000000000000000000000000000') {
        uniqueHolders.add(bidder.toLowerCase())
      }
    }

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
      { treasury: '0.0000', holders: 0 },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        }
      }
    )
  }
}
