'use client'

import { useAuction } from '@/lib/hooks/useAuction'
import { AuctionTimer } from './AuctionTimer'
import { AnonImage, AnonImagePlaceholder } from './AnonImage'
import { formatEther } from 'viem'

export function AuctionHero() {
  const { auction, isLoading, error } = useAuction()

  if (isLoading) {
    return (
      <div className="bg-nouns-surface rounded-2xl p-8 animate-pulse border border-nouns-border">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-64 h-64 bg-warm-bg rounded-lg" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-warm-bg rounded w-48" />
            <div className="h-12 bg-warm-bg rounded w-32" />
            <div className="h-6 bg-warm-bg rounded w-64" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-nouns-surface rounded-2xl p-8 text-center border border-nouns-border">
        <p className="text-nouns-muted">Unable to load auction data</p>
        <p className="text-nouns-muted/60 text-sm mt-2">
          Make sure contracts are deployed and addresses are configured
        </p>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="bg-nouns-surface rounded-2xl p-8 text-center border border-nouns-border">
        <h2 className="text-2xl font-bold text-nouns-text mb-2">No Active Auction</h2>
        <p className="text-nouns-muted">Waiting for the first auction to begin...</p>
      </div>
    )
  }

  const isDusk = auction.isDusk
  const accentColor = isDusk ? 'text-nouns-blue' : 'text-nouns-red'
  const bgColor = isDusk ? 'bg-cool-bg' : 'bg-warm-bg'
  const borderColor = isDusk ? 'border-cool-border' : 'border-warm-border'
  const badgeBg = isDusk ? 'bg-nouns-blue/10 text-nouns-blue' : 'bg-nouns-red/10 text-nouns-red'
  const currentBid = auction.amount > 0n ? formatEther(auction.amount) : '0'
  const hasBids = auction.bidder !== '0x0000000000000000000000000000000000000000'

  return (
    <div className={`${bgColor} rounded-2xl p-8 border-2 ${borderColor}`}>
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Anon Image */}
        <div className="flex-shrink-0">
          {auction.settled ? (
            <AnonImagePlaceholder size="lg" isDusk={isDusk} />
          ) : (
            <AnonImage tokenId={auction.anonId} size="lg" />
          )}
        </div>

        {/* Auction Details */}
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
            <h1 className="text-3xl font-bold text-nouns-text">
              Anon #{auction.anonId.toString()}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeBg}`}>
              {isDusk ? 'Dusk' : 'Dawn'}
            </span>
          </div>

          {/* Current Bid */}
          <div className="mb-6">
            <p className="text-nouns-muted text-sm mb-1">
              {hasBids ? 'Current bid' : 'Reserve price'}
            </p>
            <p className={`text-4xl font-bold ${accentColor}`}>
              {currentBid} ETH
            </p>
            {hasBids && (
              <p className="text-nouns-muted/60 text-sm mt-1">
                by {auction.bidder.slice(0, 6)}...{auction.bidder.slice(-4)}
              </p>
            )}
          </div>

          {/* Timer */}
          <AuctionTimer endTime={auction.endTime} isDusk={isDusk} />

          {/* CTA */}
          <div className="mt-6">
            <p className="text-nouns-muted/60 text-sm">
              Connect your ERC-8004 registered agent wallet to bid
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
