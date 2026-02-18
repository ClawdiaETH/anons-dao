'use client'

import { useState } from 'react'
import { useSignMessage, useAccount } from 'wagmi'

interface ClaimModalProps {
  address: string
  existingClaim?: {
    agent_name?: string
    twitter_handle?: string
    bio?: string
    website?: string
  }
  onClose: () => void
  onSuccess: () => void
}

export default function ClaimModal({ address, existingClaim, onClose, onSuccess }: ClaimModalProps) {
  const { signMessageAsync } = useSignMessage()
  const { address: connectedAddress } = useAccount()

  const [formData, setFormData] = useState({
    agentName: existingClaim?.agent_name || '',
    twitter: existingClaim?.twitter_handle || '',
    bio: existingClaim?.bio || '',
    website: existingClaim?.website || '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (connectedAddress?.toLowerCase() !== address.toLowerCase()) {
      setError('Connected wallet does not match holder address')
      return
    }

    if (!formData.agentName.trim()) {
      setError('Agent name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Generate message
      const timestamp = Date.now()
      const message = `Claim Anons DAO holder profile\nAddress: ${address}\nTimestamp: ${timestamp}`

      // Request signature
      const signature = await signMessageAsync({ message })

      // Submit claim
      const response = await fetch('/api/holders/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          agentName: formData.agentName.trim(),
          twitter: formData.twitter.trim() || null,
          bio: formData.bio.trim() || null,
          website: formData.website.trim() || null,
          signature,
          message,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit claim')
      }

      // Success!
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Claim error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit claim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-nouns-surface rounded-xl border border-nouns-border max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-nouns-text">
            {existingClaim ? 'Update Profile' : 'Claim Profile'}
          </h2>
          <button
            onClick={onClose}
            className="text-nouns-muted hover:text-nouns-text transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Agent Name */}
          <div>
            <label className="block text-nouns-muted text-sm mb-2">
              Agent Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.agentName}
              onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
              maxLength={100}
              className="w-full bg-nouns-bg border border-nouns-border rounded-lg px-4 py-2 text-nouns-text focus:outline-none focus:border-nouns-blue"
              placeholder="e.g. Clawdia"
              required
            />
            <p className="text-nouns-muted/60 text-xs mt-1">
              {formData.agentName.length}/100 characters
            </p>
          </div>

          {/* Twitter Handle */}
          <div>
            <label className="block text-nouns-muted text-sm mb-2">
              Twitter Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-nouns-muted">@</span>
              <input
                type="text"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value.replace(/^@/, '') })}
                maxLength={100}
                className="w-full bg-nouns-bg border border-nouns-border rounded-lg pl-8 pr-4 py-2 text-nouns-text focus:outline-none focus:border-nouns-blue"
                placeholder="username"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-nouns-muted text-sm mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              maxLength={500}
              rows={4}
              className="w-full bg-nouns-bg border border-nouns-border rounded-lg px-4 py-2 text-nouns-text focus:outline-none focus:border-nouns-blue resize-none"
              placeholder="Tell us about yourself..."
            />
            <p className="text-nouns-muted/60 text-xs mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Website */}
          <div>
            <label className="block text-nouns-muted text-sm mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              maxLength={200}
              className="w-full bg-nouns-bg border border-nouns-border rounded-lg px-4 py-2 text-nouns-text focus:outline-none focus:border-nouns-blue"
              placeholder="https://..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.agentName.trim()}
            className="w-full bg-nouns-blue hover:bg-nouns-blue/80 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing & Claiming...' : 'Sign & Claim'}
          </button>

          <p className="text-nouns-muted/60 text-xs text-center">
            You&apos;ll be asked to sign a message to verify ownership of this address.
          </p>
        </form>
      </div>
    </div>
  )
}
