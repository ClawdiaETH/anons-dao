'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'
import { useAccount } from 'wagmi'
import ClaimModal from '@/components/ClaimModal'

const ANON_TOKEN_ADDRESS = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686'

// ABIs
const ERC721_ABI = [
  parseAbiItem('function tokenURI(uint256 tokenId) view returns (string)'),
] as const

interface TokenData {
  tokenId: string
  imageData: string
}

interface ClaimData {
  address: string
  agent_name?: string
  twitter_handle?: string
  bio?: string
  website?: string
  claimed_at?: string
}

interface HolderData {
  address: string
  ensName: string | null
  tokenCount: number
  tokens: TokenData[]
  agentId: string | null
  twitter: string | null
  claim?: ClaimData
}

export default function HoldersPage() {
  const [holders, setHolders] = useState<HolderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claimModalAddress, setClaimModalAddress] = useState<string | null>(null)
  const { address: connectedAddress } = useAccount()

  const fetchData = async () => {
    try {
      // Fetch from cached API endpoint
      const response = await fetch('/api/holders')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch holders')
      }

      // Fetch token images for display (only for first 3 tokens per holder)
      const baseClient = createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
      })

      const enrichedHolders = await Promise.all(
        data.holders.map(async (holder: {
          address: string
          ensName: string | null
          tokenCount: number
          tokenIds: string[]
          agentId: string | null
          twitter: string | null
          claim?: ClaimData
        }) => {
          // Fetch images for first 3 tokens
          const tokenImages = await Promise.all(
            (holder.tokenIds || []).slice(0, 3).map(async (tokenId: string) => {
              try {
                const tokenURI = await baseClient.readContract({
                  address: ANON_TOKEN_ADDRESS,
                  abi: ERC721_ABI,
                  functionName: 'tokenURI',
                  args: [BigInt(tokenId)],
                })

                if (tokenURI.startsWith('data:application/json;base64,')) {
                  const json = JSON.parse(
                    Buffer.from(tokenURI.slice(29), 'base64').toString()
                  )
                  return { tokenId, imageData: json.image || '' }
                }
                return { tokenId, imageData: '' }
              } catch {
                return { tokenId, imageData: '' }
              }
            })
          )

          return {
            address: holder.address,
            ensName: holder.ensName,
            tokenCount: holder.tokenCount,
            tokens: tokenImages,
            agentId: holder.agentId,
            twitter: holder.twitter,
            claim: holder.claim,
          }
        })
      )

      setHolders(enrichedHolders)
    } catch (err) {
      console.error('Error fetching holders:', err)
      setError(err instanceof Error ? err.message : 'Failed to load holders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openClaimModal = (address: string) => {
    setClaimModalAddress(address)
  }

  const closeClaimModal = () => {
    setClaimModalAddress(null)
  }

  const handleClaimSuccess = () => {
    // Refetch data to show updated claim
    setLoading(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-nouns-text">Anon Holders</h1>
        <div className="bg-nouns-surface rounded-xl p-8 text-center border border-nouns-border">
          <p className="text-nouns-muted">Loading holders...</p>
          <p className="text-nouns-muted/60 text-sm mt-2">
            This may take a minute — querying all NFTs and agent registrations
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-nouns-text">Anon Holders</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-500 font-medium">Error loading holders</p>
          <p className="text-red-500/80 text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  const selectedHolder = holders.find(h => h.address.toLowerCase() === claimModalAddress?.toLowerCase())

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-nouns-text">Anon Holders</h1>
        <div className="text-right">
          <p className="text-nouns-muted text-sm">Total Holders</p>
          <p className="text-2xl font-bold text-nouns-text">{holders.length}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-nouns-blue/10 border border-nouns-blue/30 rounded-xl p-4">
        <p className="text-nouns-blue text-sm">
          Showing all Anon NFT holders on Base. Agent IDs are queried from the ERC-8004 registry on Ethereum mainnet. 
          Holders can claim their profile to add custom info (name, Twitter, bio, website).
        </p>
      </div>

      {/* Holders Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {holders.map((holder) => (
          <HolderCard 
            key={holder.address} 
            holder={holder}
            connectedAddress={connectedAddress}
            onClaimClick={() => openClaimModal(holder.address)}
          />
        ))}
      </div>

      {/* Stats Footer */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">Total Anons</p>
          <p className="text-2xl font-bold text-nouns-text">
            {holders.reduce((sum, h) => sum + h.tokenCount, 0)}
          </p>
        </div>
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">ERC-8004 Registered</p>
          <p className="text-2xl font-bold text-nouns-text">
            {holders.filter(h => h.agentId).length}
          </p>
        </div>
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">With Claims</p>
          <p className="text-2xl font-bold text-nouns-text">
            {holders.filter(h => h.claim).length}
          </p>
        </div>
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">With Twitter</p>
          <p className="text-2xl font-bold text-nouns-text">
            {holders.filter(h => h.claim?.twitter_handle || h.twitter).length}
          </p>
        </div>
      </div>

      {/* Claim Modal */}
      {claimModalAddress && selectedHolder && (
        <ClaimModal
          address={claimModalAddress}
          existingClaim={selectedHolder.claim}
          onClose={closeClaimModal}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  )
}

function HolderCard({ 
  holder, 
  connectedAddress,
  onClaimClick 
}: { 
  holder: HolderData
  connectedAddress?: string
  onClaimClick: () => void
}) {
  const isOwner = connectedAddress?.toLowerCase() === holder.address.toLowerCase()
  const displayName = holder.claim?.agent_name
  const displayTwitter = holder.claim?.twitter_handle || holder.twitter
  
  // Fallback: Extract agent ID from bio if mainnet check failed
  let displayAgentId = holder.agentId
  if (!displayAgentId && holder.claim?.bio) {
    const match = holder.claim.bio.match(/ERC-8004 Agent ID (\d+)/i)
    if (match) {
      displayAgentId = match[1]
    }
  }

  return (
    <div className="bg-nouns-surface rounded-xl border border-nouns-border p-6 hover:border-nouns-blue/50 transition-colors">
      {/* Token Images */}
      <div className="flex gap-2 mb-4">
        {holder.tokens.map((token) => (
          <a
            key={token.tokenId}
            href={`https://opensea.io/assets/base/${ANON_TOKEN_ADDRESS}/${token.tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-16 h-16 rounded-lg bg-nouns-bg border border-nouns-border flex items-center justify-center overflow-hidden hover:border-nouns-blue transition-colors"
            title={`View Anon #${token.tokenId} on OpenSea`}
          >
            {token.imageData ? (
              <img
                src={token.imageData}
                alt={`Anon #${token.tokenId}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-nouns-muted text-xs">#{token.tokenId}</span>
            )}
          </a>
        ))}
        {holder.tokenCount > 3 && (
          <div className="w-16 h-16 rounded-lg bg-nouns-bg border border-nouns-border flex items-center justify-center">
            <span className="text-nouns-muted text-xs">+{holder.tokenCount - 3}</span>
          </div>
        )}
      </div>

      {/* Name (if claimed) */}
      {displayName && (
        <div className="mb-3">
          <h3 className="text-nouns-text font-bold text-xl">{displayName}</h3>
        </div>
      )}

      {/* Address / ENS */}
      <div className="mb-3">
        <p className="text-nouns-muted text-xs mb-1">
          {holder.ensName ? 'ENS' : 'Address'}
        </p>
        <a
          href={`https://basescan.org/address/${holder.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nouns-text hover:text-nouns-blue transition-colors font-mono text-sm"
          title={holder.ensName ? holder.address : undefined}
        >
          {holder.ensName || `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`}
        </a>
      </div>

      {/* Token Count */}
      <div className="mb-3">
        <p className="text-nouns-muted text-xs mb-1">Anons Owned</p>
        <p className="text-nouns-text font-semibold">{holder.tokenCount}</p>
      </div>

      {/* Agent ID */}
      <div className="mb-3">
        <p className="text-nouns-muted text-xs mb-1">ERC-8004 Agent ID</p>
        {displayAgentId ? (
          <a
            href={`https://www.8004scan.io/agents/ethereum/${displayAgentId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nouns-blue hover:underline font-mono text-sm"
          >
            #{displayAgentId}
          </a>
        ) : (
          <p className="text-nouns-muted/60 text-sm">Not registered</p>
        )}
      </div>

      {/* Twitter */}
      <div className="mb-3">
        <p className="text-nouns-muted text-xs mb-1">Twitter</p>
        {displayTwitter ? (
          <a
            href={`https://twitter.com/${displayTwitter}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nouns-blue hover:underline text-sm"
          >
            @{displayTwitter}
          </a>
        ) : (
          <p className="text-nouns-muted/60 text-sm">Unknown</p>
        )}
      </div>

      {/* Bio (if claimed) */}
      {holder.claim?.bio && (
        <div className="mb-3">
          <p className="text-nouns-muted text-xs mb-1">Bio</p>
          <p className="text-nouns-text text-sm">{holder.claim.bio}</p>
        </div>
      )}

      {/* Website (if claimed) */}
      {holder.claim?.website && (
        <div className="mb-3">
          <p className="text-nouns-muted text-xs mb-1">Website</p>
          <a
            href={holder.claim.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nouns-blue hover:underline text-sm break-all"
          >
            {holder.claim.website}
          </a>
        </div>
      )}

      {/* Claim Button (only show for wallet owner) */}
      {isOwner && (
        <button
          onClick={onClaimClick}
          className="w-full mt-4 bg-nouns-blue hover:bg-nouns-blue/80 text-white font-bold py-2 rounded-lg transition-colors"
        >
          {holder.claim ? 'Update Profile' : 'Claim Profile'}
        </button>
      )}
    </div>
  )
}
