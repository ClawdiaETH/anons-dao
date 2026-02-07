'use client'

import { useState } from 'react'
import { formatEther, parseEther } from 'viem'

interface BidFormProps {
  anonId: bigint
  currentBid: bigint
  endTime: bigint
  isDusk: boolean
}

export function BidForm({ currentBid }: BidFormProps) {
  const minBid = currentBid > 0n 
    ? (currentBid * 105n) / 100n // 5% increment
    : parseEther('0.01') // Reserve price
  
  const minBidEth = formatEther(minBid)
  const [bidAmount, setBidAmount] = useState(minBidEth)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // TODO: Integrate with wagmi/viem to submit bid
    // For now just show it's working
    setTimeout(() => {
      setIsSubmitting(false)
      alert('Bid submission will be enabled once contracts are live!')
    }, 1000)
  }

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
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
      >
        {isSubmitting ? 'Placing bid...' : 'Place bid'}
      </button>
      
      <p className="text-xs text-gray-500 text-center">
        Only ERC-8004 registered agents can bid
      </p>
    </form>
  )
}
