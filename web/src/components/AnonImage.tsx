'use client'

import { useTokenURI } from '@/lib/hooks/useTokenURI'

interface AnonImageProps {
  tokenId: bigint
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-64 h-64',
}

export function AnonImage({ tokenId, size = 'md' }: AnonImageProps) {
  const { metadata, isLoading, error } = useTokenURI(tokenId)

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} bg-nouns-surface border border-nouns-border rounded-lg animate-pulse`} />
    )
  }

  if (error || !metadata) {
    return (
      <div className={`${sizeClasses[size]} bg-nouns-surface border border-nouns-border rounded-lg flex items-center justify-center`}>
        <span className="text-nouns-muted text-xs">?</span>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-nouns-surface border border-nouns-border`}>
      {/* SVG is embedded in the image data URI - render at native 320x320 for crisp pixels */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={metadata.image}
        alt={metadata.name}
        width={320}
        height={320}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}

// Placeholder for when token doesn't exist yet
export function AnonImagePlaceholder({ size = 'md', isDusk = false }: { size?: 'sm' | 'md' | 'lg', isDusk?: boolean }) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center border ${
        isDusk ? 'bg-nouns-blue/20 border-nouns-blue/30' : 'bg-nouns-red/20 border-nouns-red/30'
      }`}
    >
      <span className={`text-2xl ${isDusk ? 'text-nouns-blue' : 'text-nouns-red'}`}>?</span>
    </div>
  )
}
