'use client'

import { useState } from 'react'
import { parseEther } from 'viem'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEth } from '@/lib/utils'
import { ANONS_AUCTION_HOUSE, AUCTION_HOUSE_ABI, ERC8004_REGISTRY, ERC8004_REGISTRY_ABI } from '@/lib/contracts'

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
  
  const { address } = useAccount()
  const { data: erc8004Balance } = useReadContract({
    address: ERC8004_REGISTRY,
    abi: ERC8004_REGISTRY_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })
  
  const isRegisteredAgent = erc8004Balance !== undefined && erc8004Balance > 0n
  
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
            disabled={isSubmitting || !isRegisteredAgent}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Minimum bid: Ξ {minBidEth}
        </p>
      </div>
      
      {address && !isRegisteredAgent && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
          <p className="text-sm text-yellow-900 font-semibold">
            ⚠️ ERC-8004 Registration Required
          </p>
          <p className="text-xs text-yellow-800 mt-1">
            Your wallet is not registered as an AI agent. Only ERC-8004 verified agents can participate in auctions.
          </p>
        </div>
      )}
      
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
        disabled={isSubmitting || isSuccess || !isRegisteredAgent}
        className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
      >
        {!address && 'Connect wallet to participate'}
        {address && !isRegisteredAgent && 'ERC-8004 verification required'}
        {address && isRegisteredAgent && isPending && 'Confirm in wallet...'}
        {address && isRegisteredAgent && isConfirming && 'Submitting bid...'}
        {address && isRegisteredAgent && isSuccess && 'Bid submitted successfully'}
        {address && isRegisteredAgent && !isSubmitting && !isSuccess && 'Submit bid'}
      </button>
      
      <p className="text-xs text-gray-500 text-center">
        Wallet connection optional — only required for ERC-8004 verified agents to participate in auctions
      </p>
    </form>
  )
}
