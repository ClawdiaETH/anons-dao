'use client'

import { useAuction } from '@/lib/hooks/useAuction'
import { AuctionTimer } from './AuctionTimer'
import { AnonImage } from './AnonImage'
import { BidForm } from './BidForm'
import { formatEther } from 'viem'
import Image from 'next/image'

export function AuctionHero() {
  const { auction, isLoading, error } = useAuction()

  // Placeholder state - show Clawdia's Anon #0
  if (isLoading || error || !auction) {
    return <AuctionHeroPlaceholder isLoading={isLoading} />
  }

  const isDusk = auction.isDusk
  const currentBid = auction.amount > 0n ? formatEther(auction.amount) : '0.01'
  const hasBids = auction.bidder !== '0x0000000000000000000000000000000000000000'
  
  // Use Anon's actual background color (would come from seed/descriptor in real implementation)
  // For now using dawn/dusk theme colors
  const bgColor = isDusk ? '#d5d7e1' : '#e1d7d5'

  return (
    <div 
      className="w-screen relative left-1/2 right-1/2 -mx-[50vw] min-h-[600px] flex items-center justify-center py-12"
      style={{ backgroundColor: bgColor }}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left: Anon Character */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <AnonImage tokenId={auction.anonId} size="xl" />
            </div>
          </div>

          {/* Right: Bid Interface */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200">
            {/* Header */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-1">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Anon {auction.anonId.toString()}
              </h1>
            </div>

            {/* Current Bid & Timer */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-500 text-sm mb-1">Current bid</p>
                <p className="text-3xl font-bold text-gray-900">
                  Ξ {currentBid}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Auction ends in</p>
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
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Recent bids</h3>
              </div>
              {hasBids ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                      <span className="font-mono text-sm">
                        {auction.bidder.slice(0, 6)}...{auction.bidder.slice(-4)}
                      </span>
                    </div>
                    <span className="font-bold">Ξ {currentBid}</span>
                  </div>
                  <button className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2">
                    View all bids
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
    </div>
  )
}

// Placeholder with Clawdia's Anon #0
function AuctionHeroPlaceholder({ isLoading }: { isLoading: boolean }) {
  // Clawdia's background color (dawn - warm gray)
  const bgColor = '#e1d7d5'

  return (
    <div 
      className="w-screen relative left-1/2 right-1/2 -mx-[50vw] min-h-[600px] flex items-center justify-center py-12"
      style={{ backgroundColor: bgColor }}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left: Clawdia's Anon #0 */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <Image 
                src="/anon-0-preview.png" 
                alt="Anon #0 - Clawdia"
                width={500}
                height={500}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Right: Placeholder Message */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-2/3" />
                <div className="h-12 bg-gray-200 rounded w-1/2" />
                <div className="h-24 bg-gray-200 rounded" />
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
                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                  Anon 0
                </h1>
                <div className="space-y-4 text-gray-600">
                  <p className="text-lg">
                    <span className="font-bold text-gray-900">Clawdia&apos;s genesis Anon.</span>
                  </p>
                  <p>
                    Auctions will begin once the contracts are deployed to Base mainnet.
                  </p>
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
                    <ul className="space-y-2 text-sm">
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
