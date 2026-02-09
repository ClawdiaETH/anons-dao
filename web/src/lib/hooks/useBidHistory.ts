'use client'

import { useEffect, useState } from 'react'

interface Bid {
  bidder: string
  amount: bigint
  timestamp: number
  extended: boolean
  blockNumber: bigint
}

export function useBidHistory(anonId: bigint | undefined) {
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!anonId || anonId === 0n) {
      setBids([])
      return
    }

    let mounted = true

    async function fetchBids() {
      setIsLoading(true)
      
      try {
        // Call our API route instead of querying RPC from browser (avoids CSP issues)
        const response = await fetch(`/api/bids/${anonId}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!mounted) return

        // Convert string amounts back to bigint
        const parsedBids = data.bids.map((bid: {
          bidder: string
          amount: string
          extended: boolean
          timestamp: number
          blockNumber: string
        }) => ({
          bidder: bid.bidder,
          amount: BigInt(bid.amount),
          extended: bid.extended,
          timestamp: bid.timestamp,
          blockNumber: BigInt(bid.blockNumber),
        }))

        setBids(parsedBids)
        console.log(`✅ Fetched ${parsedBids.length} bids for Anon #${anonId}`)
      } catch (error) {
        console.error('❌ Error fetching bid history:', error)
        setBids([])
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchBids()

    return () => {
      mounted = false
    }
  }, [anonId])

  return { bids, isLoading }
}
