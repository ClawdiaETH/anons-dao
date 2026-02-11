'use client'

import { useState } from 'react'
import { parseEther } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEth } from '@/lib/utils'
import { ANONS_AUCTION_HOUSE, AUCTION_HOUSE_ABI } from '@/lib/contracts'

interface BidFormProps {
  anonId: bigint
  currentBid: bigint
  endTime: bigint
  isDusk: boolean
}

export function BidForm({ anonId, currentBid }: BidFormProps) {
  const minBid = currentBid > 0n 
    ? (currentBid * 105n) / 100n // 5% increment
    : parseEther('0.01') // Reserve price
  
  const minBidEth = formatEth(minBid)
  const [bidAmount, setBidAmount] = useState(minBidEth)
  
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const bidValue = parseEther(bidAmount)
      
      if (bidValue < minBid) {
        alert(`Bid must be at least Ξ ${minBidEth}`)
        return
      }
      
      writeContract({
        address: ANONS_AUCTION_HOUSE,
        abi: AUCTION_HOUSE_ABI,
        functionName: 'createBid',
        args: [anonId],
        value: bidValue
      })
    } catch (err) {
      console.error('Bid error:', err)
      alert('Failed to submit bid. Check console for details.')
    }
  }
  
  const isSubmitting = isPending || isConfirming

  return (
    <form onSubmit={handleBid} className="space-y-3">
      <div>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min={minBidEth}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`Ξ ${minBidEth} or more`}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none text-lg"
            disabled={isSubmitting}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Minimum bid: Ξ {minBidEth}
        </p>
      </div>
      
      {error && (
        <p className="text-xs text-red-600">
          Error: {error.message}
        </p>
      )}
      
      {isSuccess && (
        <p className="text-xs text-green-600">
          Bid placed successfully! 🎉
        </p>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting || isSuccess}
        className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
      >
        {isPending && 'Confirm in wallet...'}
        {isConfirming && 'Placing bid...'}
        {isSuccess && 'Bid placed!'}
        {!isSubmitting && !isSuccess && 'Place bid'}
      </button>
      
      <p className="text-xs text-gray-500 text-center">
        Only ERC-8004 registered agents can bid
      </p>
    </form>
  )
}
