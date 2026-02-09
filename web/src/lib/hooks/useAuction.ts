'use client'

import { useReadContract, useWatchContractEvent } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { AUCTION_HOUSE_ADDRESS, auctionHouseABI, Auction } from '../contracts'
import { CHAIN_ID } from '../wagmi'

export function useAuction() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useReadContract({
    address: AUCTION_HOUSE_ADDRESS,
    abi: auctionHouseABI,
    functionName: 'auction',
    chainId: CHAIN_ID,
    query: {
      enabled: !!AUCTION_HOUSE_ADDRESS,
      refetchInterval: 5000, // Poll every 5 seconds
    },
  })

  // Watch for bid events to trigger immediate updates
  useWatchContractEvent({
    address: AUCTION_HOUSE_ADDRESS,
    abi: auctionHouseABI,
    eventName: 'AuctionBid',
    chainId: CHAIN_ID,
    onLogs: () => {
      // Invalidate and refetch when new bid comes in
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
      refetch()
    },
  })

  const auction = data as Auction | undefined

  // Debug logging
  if (typeof window !== 'undefined' && !isLoading) {
    console.log('useAuction:', { 
      hasData: !!data, 
      auction: auction ? {
        anonId: auction.anonId?.toString(),
        startTime: auction.startTime?.toString(),
        endTime: auction.endTime?.toString(),
      } : null,
      error: error?.message,
      address: AUCTION_HOUSE_ADDRESS 
    })
  }

  return {
    auction,
    isLoading,
    error,
    refetch,
  }
}
