'use client'

import { formatEther } from 'viem'

interface Bid {
  bidder: string
  amount: bigint
  timestamp: number
  extended: boolean
}

interface BidHistoryProps {
  bids: Bid[]
  isDusk: boolean
}

export function BidHistory({ bids, isDusk }: BidHistoryProps) {
  const accentColor = isDusk ? 'text-nouns-blue' : 'text-nouns-red'

  if (bids.length === 0) {
    return (
      <div className="bg-nouns-surface rounded-xl p-6 border border-nouns-border">
        <h3 className="text-lg font-bold text-nouns-text mb-4">Bid History</h3>
        <p className="text-nouns-muted/60 text-center py-4">No bids yet</p>
      </div>
    )
  }

  return (
    <div className="bg-nouns-surface rounded-xl p-6 border border-nouns-border">
      <h3 className="text-lg font-bold text-nouns-text mb-4">Bid History</h3>
      <div className="space-y-3">
        {bids.map((bid, index) => (
          <div
            key={`${bid.bidder}-${bid.timestamp}`}
            className={`flex items-center justify-between p-3 rounded-lg ${
              index === 0 ? (isDusk ? 'bg-nouns-blue/10' : 'bg-nouns-red/10') : 'bg-warm-bg'
            }`}
          >
            <div>
              <p className="text-nouns-text font-mono text-sm">
                {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
              </p>
              <p className="text-nouns-muted/60 text-xs">
                {new Date(bid.timestamp * 1000).toLocaleTimeString()}
                {bid.extended && (
                  <span className="ml-2 text-nouns-yellow">+5m</span>
                )}
              </p>
            </div>
            <p className={`font-bold ${index === 0 ? accentColor : 'text-nouns-text'}`}>
              {formatEther(bid.amount)} ETH
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Placeholder when no contract is configured
export function BidHistoryPlaceholder() {
  return (
    <div className="bg-nouns-surface rounded-xl p-6 border border-nouns-border">
      <h3 className="text-lg font-bold text-nouns-text mb-4">Bid History</h3>
      <p className="text-nouns-muted/60 text-center py-4">
        Configure contract addresses to see bid history
      </p>
    </div>
  )
}
