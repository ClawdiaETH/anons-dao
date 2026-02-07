'use client'

import { AUCTION_HOUSE_ADDRESS, TOKEN_ADDRESS, DAO_ADDRESS } from '@/lib/contracts'
import { CHAIN_ID } from '@/lib/wagmi'

export function DebugInfo() {
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs font-mono max-w-md">
      <div className="font-bold mb-2">Debug Info</div>
      <div className="space-y-1">
        <div>Chain ID: {CHAIN_ID}</div>
        <div>Auction: {AUCTION_HOUSE_ADDRESS || 'NOT SET'}</div>
        <div>Token: {TOKEN_ADDRESS || 'NOT SET'}</div>
        <div>DAO: {DAO_ADDRESS || 'NOT SET'}</div>
      </div>
    </div>
  )
}
