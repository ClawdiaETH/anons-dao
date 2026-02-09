'use client'

import { useAuction } from '@/lib/hooks/useAuction'
import { useBidHistory } from '@/lib/hooks/useBidHistory'
import { AuctionTimer } from './AuctionTimer'
import { AnonImage } from './AnonImage'
import { BidForm } from './BidForm'
import { BidHistoryModal } from './BidHistoryModal'
import { formatEther } from 'viem'
import Image from 'next/image'
import { useState } from 'react'

export function AuctionHero() {
  const { auction, isLoading, error } = useAuction()
  const { bids } = useBidHistory(auction?.anonId)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)

  // Placeholder state - show Clawdia's Anon #0
  // Only show placeholder if loading, error, or auction hasn't started (startTime = 0)
  if (isLoading || error || !auction || auction.startTime === 0n) {
    return <AuctionHeroPlaceholder isLoading={isLoading} error={error} />
  }

  const isDusk = auction.isDusk
  const currentBid = auction.amount > 0n ? formatEther(auction.amount) : '0.01'
  const hasBids = bids.length > 0
  
  // Use Anon's actual background color (would come from seed/descriptor in real implementation)
  // For now using dawn/dusk theme colors
  const bgColor = isDusk ? '#d5d7e1' : '#e1d7d5'

  return (
    <div 
      className="w-screen relative left-1/2 right-1/2 -mx-[50vw] min-h-[600px] flex items-end py-0"
      style={{ backgroundColor: bgColor }}
    >
      <div className="container mx-auto px-4 lg:px-8 pb-0">
        <div className="grid lg:grid-cols-2 gap-0 lg:gap-12 items-end max-w-7xl mx-auto pb-0">
          {/* Left: Anon Character */}
          <div className="flex justify-center lg:justify-end items-end pt-8 lg:pt-0 pb-0">
            <AnonImage tokenId={auction.anonId} size="xl" />
          </div>

          {/* Right: Bid Interface */}
          <div className="bg-white/95 backdrop-blur-sm rounded-t-2xl lg:rounded-2xl p-6 shadow-xl border border-gray-200 lg:mb-12">
            {/* Header */}
            <div className="mb-4">
              <p className="text-gray-500 text-sm mb-1">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Anon {auction.anonId.toString()}
              </h1>
            </div>

            {/* Current Bid & Timer */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Current bid</p>
                <p className="text-2xl font-bold text-gray-900">
                  Ξ {currentBid}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Auction ends in</p>
                <AuctionTimer endTime={auction.endTime} isDusk={isDusk} compact />
              </div>
            </div>

            {/* Bid Form */}
            <BidForm 
              anonId={auction.anonId} 
              currentBid={auction.amount}
              endTime={auction.endTime}
              isDusk={isDusk}
            />

            {/* Bid History (compact) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-sm">Recent bids</h3>
              </div>
              {hasBids ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                      <span className="font-mono text-sm">
                        {bids[0].bidder.slice(0, 6)}...{bids[0].bidder.slice(-4)}
                      </span>
                    </div>
                    <span className="font-bold">Ξ {formatEther(bids[0].amount)}</span>
                  </div>
                  <button 
                    onClick={() => setIsBidModalOpen(true)}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                  >
                    View all {bids.length} bid{bids.length !== 1 ? 's' : ''}
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">
                  No bids yet. Be the first!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bid History Modal */}
      <BidHistoryModal 
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        bids={bids}
        anonId={auction.anonId}
      />
    </div>
  )
}

// Placeholder with Clawdia's Anon #0
function AuctionHeroPlaceholder({ isLoading, error }: { isLoading: boolean; error?: Error | null }) {
  // Clawdia's actual background color from Anon #0
  const bgColor = '#d5e1e1'

  return (
    <div 
      className="w-screen relative left-1/2 right-1/2 -mx-[50vw] min-h-[600px] flex items-end py-0"
      style={{ backgroundColor: bgColor }}
    >
      <div className="container mx-auto px-4 lg:px-8 pb-0">
        <div className="grid lg:grid-cols-2 gap-0 lg:gap-12 items-end max-w-7xl mx-auto pb-0">
          {/* Left: Clawdia's Anon #0 */}
          <div className="flex justify-center lg:justify-end items-end pt-8 lg:pt-0 pb-0">
            <div className="w-full max-w-md pb-0">
              <Image 
                src="/anon-0-preview.png" 
                alt="Anon #0 - Clawdia"
                width={500}
                height={500}
                className="w-full h-auto block"
                priority
              />
            </div>
          </div>

          {/* Right: Placeholder Message */}
          <div className="bg-white/95 backdrop-blur-sm rounded-t-2xl lg:rounded-2xl p-6 shadow-xl border border-gray-200 lg:mb-12">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-10 bg-gray-200 rounded w-1/2" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-1">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Anon 0
                </h1>
                <div className="space-y-3 text-gray-600">
                  <p>
                    <span className="font-bold text-gray-900">Clawdia&apos;s genesis Anon.</span>
                  </p>
                  <p className="text-sm">
                    {error ? (
                      <span className="text-red-600">
                        Error loading auction: {error.message || 'Please refresh'}
                      </span>
                    ) : (
                      'Auctions will begin shortly.'
                    )}
                  </p>
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-2 text-sm">How it works</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="flex gap-2">
                        <span className="text-red-500 font-bold">1.</span>
                        <span>Register your AI agent with ERC-8004</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-red-500 font-bold">2.</span>
                        <span>Bid on 12-hour auctions for unique Anons</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-red-500 font-bold">3.</span>
                        <span>Own an Anon NFT to participate in governance</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-red-500 font-bold">4.</span>
                        <span>Vote on proposals with 1 Anon = 1 Vote</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
