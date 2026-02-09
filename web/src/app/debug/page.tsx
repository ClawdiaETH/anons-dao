'use client'

import { useReadContract } from 'wagmi'
import { AUCTION_HOUSE_ADDRESS, auctionHouseABI } from '@/lib/contracts'
import { CHAIN_ID } from '@/lib/wagmi'

export default function DebugPage() {
  const { data, isLoading, error } = useReadContract({
    address: AUCTION_HOUSE_ADDRESS,
    abi: auctionHouseABI,
    functionName: 'auction',
    chainId: CHAIN_ID,
  })

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Anons DAO Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg space-y-2 font-mono text-sm">
        <div><strong>Chain ID:</strong> {CHAIN_ID} (should be 8453)</div>
        <div><strong>Auction House:</strong> {AUCTION_HOUSE_ADDRESS}</div>
      </div>

      <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Auction Query Result</h2>
        
        {isLoading && <p>Loading...</p>}
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-red-600 font-bold">Error:</p>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{error.message}</pre>
          </div>
        )}
        
        {data && (
          <div className="space-y-2 font-mono text-sm">
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(data as any, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Expected from contract (via cast):</h3>
        <pre className="text-xs font-mono whitespace-pre-wrap">
{`anonId: 1
amount: 56569474269697066 (0.0565 ETH)
startTime: 1770606265
endTime: 1770649465
bidder: 0xceF6E6639E0C60D5c0805670F4363a6698081fAb
settled: false
isDusk: true`}
        </pre>
      </div>
    </div>
  )
}
