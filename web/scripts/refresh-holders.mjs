#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { createPublicClient, http } from 'viem'
import { base, mainnet } from 'viem/chains'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sql = neon(process.env.DATABASE_URL)

const ANON_TOKEN_ADDRESS = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686'
const ERC8004_REGISTRY = '0x00256C0D814c455425A0699D5eEE2A7DB7A5519c'

const ERC721_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

async function refreshHolders() {
  console.log('🔄 Refreshing holders snapshot...\n')

  // Create clients
  const baseClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  })

  const mainnetClient = createPublicClient({
    chain: mainnet,
    transport: http('https://cloudflare-eth.com'),
  })

  // Get total supply
  const totalSupply = await baseClient.readContract({
    address: ANON_TOKEN_ADDRESS,
    abi: ERC721_ABI,
    functionName: 'totalSupply',
  })

  console.log(`📊 Total supply: ${totalSupply}`)

  // Build holders map
  const holdersMap = new Map()
  const batchSize = 50

  console.log('⛓️  Querying NFT ownership...')
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
          holdersMap.set(ownerLower, { address: owner, tokens: [] })
        }
        holdersMap.get(ownerLower).tokens.push(tokenId)
      }
    })

    console.log(`  Processed ${Math.min(end, Number(totalSupply))}/${totalSupply} tokens`)
  }

  console.log(`\n👥 Found ${holdersMap.size} unique holders`)

  // Fetch claims
  const claims = await sql`SELECT address, twitter_handle, bio FROM holders_claims`
  const claimsMap = new Map(claims.map((c) => [c.address.toLowerCase(), c]))

  // Enrich holders
  console.log('\n🔍 Enriching holder data...')
  let processed = 0

  for (const [address, holder] of holdersMap.entries()) {
    const claim = claimsMap.get(address)

    // Check ERC-8004 (with timeout)
    let agentId = null
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      )
      const balance = await Promise.race([
        mainnetClient.readContract({
          address: ERC8004_REGISTRY,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [holder.address],
        }),
        timeoutPromise,
      ])

      if (balance && balance > 0n) {
        const tokenId = await mainnetClient.readContract({
          address: ERC8004_REGISTRY,
          abi: ERC721_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [holder.address, 0n],
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
    let ensName = null
    let twitter = null

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      )
      ensName = await Promise.race([
        mainnetClient.getEnsName({ address: holder.address }),
        timeoutPromise,
      ])

      if (ensName && !claim?.twitter_handle) {
        try {
          const textRecord = await mainnetClient.getEnsText({
            name: ensName,
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

    // Use claim Twitter if available
    if (claim?.twitter_handle) {
      twitter = claim.twitter_handle
    }

    // Upsert to database
    await sql`
      INSERT INTO holders_snapshot (address, ens_name, token_count, token_ids, agent_id, twitter, has_claim)
      VALUES (
        ${holder.address},
        ${ensName},
        ${holder.tokens.length},
        ${holder.tokens},
        ${agentId},
        ${twitter},
        ${!!claim}
      )
      ON CONFLICT (address) DO UPDATE SET
        ens_name = EXCLUDED.ens_name,
        token_count = EXCLUDED.token_count,
        token_ids = EXCLUDED.token_ids,
        agent_id = EXCLUDED.agent_id,
        twitter = EXCLUDED.twitter,
        has_claim = EXCLUDED.has_claim,
        updated_at = NOW()
    `

    processed++
    if (processed % 5 === 0) {
      console.log(`  Processed ${processed}/${holdersMap.size} holders`)
    }
  }

  console.log(`\n✅ Snapshot refreshed! ${holdersMap.size} holders stored`)
}

refreshHolders().catch(console.error)
