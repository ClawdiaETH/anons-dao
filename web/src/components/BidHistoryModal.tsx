'use client'

import { formatEther } from 'viem'
import { useEffect } from 'react'

interface Bid {
  bidder: string
  amount: bigint
  timestamp: number
  extended: boolean
}

interface BidHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  bids: Bid[]
  anonId: bigint
}

export function BidHistoryModal({ isOpen, onClose, bids, anonId }: BidHistoryModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Anon {anonId.toString()} — Bid History
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bid List */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {bids.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No bids yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bids.map((bid, index) => (
                <div
                  key={`${bid.bidder}-${bid.timestamp}`}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                              WINNING
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(bid.timestamp * 1000).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        Ξ {formatEther(bid.amount)}
                      </p>
                      {bid.extended && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                          +5min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{bids.length} total bid{bids.length !== 1 ? 's' : ''}</span>
            {bids.length > 0 && (
              <span>
                Total volume: Ξ {formatEther(bids.reduce((sum, bid) => sum + bid.amount, 0n))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
