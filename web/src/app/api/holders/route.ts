import { NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base, mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

const ANON_TOKEN_ADDRESS = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686'
const ERC8004_REGISTRY = '0x00256C0D814c455425A0699D5eEE2A7DB7A5519c'

// Cache for 5 minutes
export const revalidate = 300

const ERC721_ABI = [
  parseAbiItem('function balanceOf(address owner) view returns (uint256)'),
  parseAbiItem('function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'),
  parseAbiItem('function tokenURI(uint256 tokenId) view returns (string)'),
  parseAbiItem('function ownerOf(uint256 tokenId) view returns (address)'),
  parseAbiItem('function totalSupply() view returns (uint256)'),
] as const

const ERC8004_ABI = [
  parseAbiItem('function balanceOf(address owner) view returns (uint256)'),
  parseAbiItem('function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'),
] as const

export async function GET() {
  try {
    // Create clients
    const baseClient = createPublicClient({
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    })

    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://cloudflare-eth.com'),
    })

    // Fetch claims
    const claimsResult = await sql`
      SELECT address, agent_name, twitter_handle, bio, website, claimed_at
      FROM holders_claims
      ORDER BY claimed_at DESC
    `
    const claimsMap = new Map(
      claimsResult.map((claim: any) => [claim.address.toLowerCase(), claim])
    )

    // Get total supply
    const totalSupply = await baseClient.readContract({
      address: ANON_TOKEN_ADDRESS,
      abi: ERC721_ABI,
      functionName: 'totalSupply',
    })

    // Build holders map by querying tokens in batches
    const holdersMap = new Map<string, { tokens: string[]; address: string }>()
    const batchSize = 50

    for (let i = 0; i < Number(totalSupply); i += batchSize) {
      const batch = []
      const end = Math.min(i + batchSize, Number(totalSupply))

      for (let tokenId = i; tokenId < end; tokenId++) {
        batch.push(
          baseClient
            .readContract({
              address: ANON_TOKEN_ADDRESS,
              abi: ERC721_ABI,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)],
            })
            .catch(() => null)
        )
      }

      const owners = await Promise.all(batch)

      owners.forEach((owner, idx) => {
        if (owner) {
          const tokenId = (i + idx).toString()
          const ownerLower = owner.toLowerCase()

          if (!holdersMap.has(ownerLower)) {
            holdersMap.set(ownerLower, { tokens: [], address: owner })
          }
          holdersMap.get(ownerLower)!.tokens.push(tokenId)
        }
      })
    }

    // Enrich holder data (skip expensive ENS/token URI calls for speed)
    const holdersData = await Promise.all(
      Array.from(holdersMap.entries()).map(async ([, holderInfo]) => {
        const address = holderInfo.address
        const tokens = holderInfo.tokens
        const claim = claimsMap.get(address.toLowerCase())

        // Check ERC-8004 registration (with timeout)
        let agentId: string | null = null
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 2000)
          )
          const balance = await Promise.race([
            mainnetClient.readContract({
              address: ERC8004_REGISTRY,
              abi: ERC8004_ABI,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            }),
            timeoutPromise,
          ])

          if (balance && (balance as bigint) > 0n) {
            const tokenId = await mainnetClient.readContract({
              address: ERC8004_REGISTRY,
              abi: ERC8004_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [address as `0x${string}`, 0n],
            })
            agentId = tokenId.toString()
          }
        } catch {
          // Fallback: extract from bio
          if (claim?.bio) {
            const match = claim.bio.match(/ERC-8004 Agent ID (\d+)/i)
            if (match) agentId = match[1]
          }
        }

        // ENS lookup (with timeout)
        let ensName: string | null = null
        let twitter: string | null = null

        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 2000)
          )
          ensName = (await Promise.race([
            mainnetClient.getEnsName({
              address: address as `0x${string}`,
            }),
            timeoutPromise,
          ])) as string | null

          if (ensName && !claim?.twitter_handle) {
            try {
              const textRecord = await mainnetClient.getEnsText({
                name: normalize(ensName),
                key: 'com.twitter',
              })
              if (textRecord) twitter = textRecord
            } catch {
              // No Twitter record
            }
          }
        } catch {
          // ENS lookup failed or timed out
        }

        return {
          address,
          ensName,
          tokenCount: tokens.length,
          tokenIds: tokens.slice(0, 5), // Only include first 5 token IDs
          agentId,
          twitter,
          claim,
        }
      })
    )

    // Sort by token count
    holdersData.sort((a, b) => b.tokenCount - a.tokenCount)

    return NextResponse.json(
      {
        success: true,
        holders: holdersData,
        totalHolders: holdersData.length,
        totalSupply: Number(totalSupply),
        cachedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching holders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch holders' },
      { status: 500 }
    )
  }
}
