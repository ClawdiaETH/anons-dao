'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { AUCTION_HOUSE_ADDRESS } from '../contracts'
import { CHAIN_ID } from '../wagmi'
import { parseAbiItem } from 'viem'

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
  const publicClient = usePublicClient({ chainId: CHAIN_ID })

  useEffect(() => {
    if (!publicClient || !anonId || anonId === 0n) {
      setBids([])
      return
    }

    let mounted = true

    async function fetchBids() {
      if (!publicClient) return
      
      setIsLoading(true)
      try {
        // Fetch all AuctionBid events for this anonId
        // Start from block 41908459 (first auction block mentioned in issue)
        const logs = await publicClient.getLogs({
          address: AUCTION_HOUSE_ADDRESS,
          event: parseAbiItem('event AuctionBid(uint256 indexed anonId, address indexed bidder, uint256 amount, bool extended)'),
          args: {
            anonId: anonId,
          },
          fromBlock: 41908459n,
          toBlock: 'latest',
        })

        if (!mounted) return

        // Get block timestamps for each bid
        const bidsWithTimestamps = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
            return {
              bidder: log.args.bidder as string,
              amount: log.args.amount as bigint,
              extended: log.args.extended as boolean,
              timestamp: Number(block.timestamp),
              blockNumber: log.blockNumber,
            }
          })
        )

        if (!mounted) return

        // Sort by block number descending (newest first)
        const sortedBids = bidsWithTimestamps.sort((a, b) => 
          Number(b.blockNumber - a.blockNumber)
        )

        setBids(sortedBids)
      } catch (error) {
        console.error('Error fetching bid history:', error)
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
  }, [publicClient, anonId])

  return { bids, isLoading }
}
