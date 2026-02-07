'use client'

import { useState, useEffect } from 'react'

interface AuctionTimerProps {
  endTime: bigint
  isDusk: boolean
  compact?: boolean
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

function formatTimeFull(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function AuctionTimer({ endTime, isDusk, compact = false }: AuctionTimerProps) {
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

  if (compact) {
    return (
      <p
        className={`font-mono text-3xl font-bold ${
          hasEnded
            ? 'text-gray-400'
            : isEnding
            ? 'text-red-500 animate-pulse'
            : 'text-gray-900'
        }`}
      >
        {hasEnded ? 'Ended' : formatTime(timeLeft)}
      </p>
    )
  }

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
        {formatTimeFull(timeLeft)}
      </p>
    </div>
  )
}
