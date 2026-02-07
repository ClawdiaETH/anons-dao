'use client'

import { useParams } from 'next/navigation'
import { AnonImage } from '@/components/AnonImage'
import { useTokenURI } from '@/lib/hooks/useTokenURI'
import Link from 'next/link'

export default function AnonPage() {
  const params = useParams()
  const tokenId = params.id ? BigInt(params.id as string) : undefined

  const { metadata, isLoading, error } = useTokenURI(tokenId)

  if (!tokenId) {
    return (
      <div className="text-center py-12">
        <p className="text-nouns-muted">Invalid token ID</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-nouns-surface rounded-2xl p-8 animate-pulse border border-nouns-border">
          <div className="w-64 h-64 bg-warm-bg rounded-lg mx-auto mb-6" />
          <div className="h-8 bg-warm-bg rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-warm-bg rounded w-full mb-2" />
          <div className="h-4 bg-warm-bg rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (error || !metadata) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-nouns-muted mb-4">Unable to load Anon #{tokenId.toString()}</p>
        <p className="text-nouns-muted/60 text-sm">
          This Anon may not exist yet or contracts may not be configured.
        </p>
        <Link href="/" className="text-nouns-blue hover:underline mt-4 inline-block">
          Back to auction
        </Link>
      </div>
    )
  }

  const isDusk = metadata.attributes.find(a => a.trait_type === 'Cycle')?.value === 'Dusk'
  const accentColor = isDusk ? 'text-nouns-blue' : 'text-nouns-red'
  const borderColor = isDusk ? 'border-nouns-blue/30' : 'border-nouns-red/30'
  const badgeBg = isDusk ? 'bg-nouns-blue/20 text-nouns-blue' : 'bg-nouns-red/20 text-nouns-red'

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-nouns-muted hover:text-nouns-text mb-6 inline-block">
        &larr; Back to auction
      </Link>

      <div className={`bg-nouns-surface rounded-2xl p-8 border-2 ${borderColor}`}>
        {/* Image */}
        <div className="flex justify-center mb-6">
          <AnonImage tokenId={tokenId} size="lg" />
        </div>

        {/* Name & Cycle */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-nouns-text mb-2">{metadata.name}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeBg}`}>
            {isDusk ? 'Dusk Cycle' : 'Dawn Cycle'}
          </span>
        </div>

        {/* Description */}
        <p className="text-nouns-muted text-center mb-8">{metadata.description}</p>

        {/* Traits */}
        <div>
          <h2 className="text-lg font-bold text-nouns-text mb-4">Traits</h2>
          <div className="grid grid-cols-2 gap-3">
            {metadata.attributes.map((attr) => (
              <div key={attr.trait_type} className="bg-warm-bg rounded-lg p-3 border border-nouns-border">
                <p className="text-nouns-muted text-xs uppercase">{attr.trait_type === 'Visor' ? 'Specs' : attr.trait_type}</p>
                <p className={`font-bold ${accentColor}`}>{attr.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
