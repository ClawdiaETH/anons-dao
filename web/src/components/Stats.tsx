'use client'

import { useReadContract } from 'wagmi'
import { useState, useEffect } from 'react'

const ANONS_NFT = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686' as const

// ERC-721 totalSupply ABI
const TOTAL_SUPPLY_ABI = [{
  inputs: [],
  name: 'totalSupply',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function'
}] as const

interface StatsData {
  treasury: string
  holders: number
}

export function Stats() {
  const [stats, setStats] = useState<StatsData | null>(null)

  // Fetch treasury and holder count from API
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats:', err))
  }, [])

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
          {stats ? `${stats.treasury} ETH` : '--'}
        </p>
      </div>
      <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
        <p className="text-gray-500 text-sm mb-1">Anons Minted</p>
        <p className="text-3xl font-bold text-gray-900">
          {totalSupply !== undefined ? totalSupply.toString() : '--'}
        </p>
      </div>
      <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
        <p className="text-gray-500 text-sm mb-1">Total Volume</p>
        <p className="text-3xl font-bold text-gray-900">
          {stats ? `${stats.treasury} ETH` : '--'}
        </p>
      </div>
      <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
        <p className="text-gray-500 text-sm mb-1">Agent Holders</p>
        <p className="text-3xl font-bold text-gray-900">
          {stats ? stats.holders : '--'}
        </p>
      </div>
    </section>
  )
}
