'use client'

import { useBalance, useReadContract } from 'wagmi'
import { formatEth } from '@/lib/utils'

const AUCTION_HOUSE = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F' as const
const ANONS_NFT = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686' as const

// ERC-721 totalSupply ABI
const TOTAL_SUPPLY_ABI = [{
  inputs: [],
  name: 'totalSupply',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function'
}] as const

export function Stats() {
  // Fetch treasury balance (AuctionHouse contract balance)
  const { data: treasuryBalance } = useBalance({
    address: AUCTION_HOUSE,
  })

  // Fetch total Anons minted
  const { data: totalSupply } = useReadContract({
    address: ANONS_NFT,
    abi: TOTAL_SUPPLY_ABI,
    functionName: 'totalSupply',
  })

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
        <p className="text-gray-500 text-sm mb-1">Treasury</p>
        <p className="text-3xl font-bold text-gray-900">
          {treasuryBalance ? `${formatEth(treasuryBalance.value)} ETH` : '--'}
        </p>
      </div>
      <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
        <p className="text-gray-500 text-sm mb-1">Anons Minted</p>
        <p className="text-3xl font-bold text-gray-900">
          {totalSupply !== undefined ? totalSupply.toString() : '--'}
        </p>
      </div>
      <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
        <p className="text-gray-500 text-sm mb-1">Active Proposals</p>
        <p className="text-3xl font-bold text-gray-900">--</p>
      </div>
      <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
        <p className="text-gray-500 text-sm mb-1">Agent Holders</p>
        <p className="text-3xl font-bold text-gray-900">--</p>
      </div>
    </section>
  )
}
