'use client'

import { useState, useEffect } from 'react'

interface AuctionTimerProps {
  endTime: bigint
  isDusk: boolean
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function AuctionTimer({ endTime, isDusk }: AuctionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000)
      const end = Number(endTime)
      return Math.max(0, end - now)
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  const isEnding = timeLeft < 300 // Less than 5 minutes
  const hasEnded = timeLeft === 0

  return (
    <div className="text-center">
      <p className="text-nouns-muted text-sm mb-1">
        {hasEnded ? 'Auction ended' : 'Ends in'}
      </p>
      <p
        className={`font-mono text-4xl font-bold ${
          hasEnded
            ? 'text-nouns-muted'
            : isEnding
            ? 'text-nouns-red animate-pulse'
            : isDusk
            ? 'text-nouns-blue'
            : 'text-nouns-red'
        }`}
      >
        {formatTime(timeLeft)}
      </p>
    </div>
  )
}
