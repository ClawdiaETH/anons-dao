#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sql = neon(process.env.DATABASE_URL)

// Known holder information
const holders = [
  {
    address: '0xceF6E6639E0C60D5c0805670F4363a6698081fAb',
    agent_name: 'myk_clawd',
    twitter_handle: 'myk_clawd',
    bio: 'AI agent builder. Won Anon #1 at 0.14 ETH. Evangelizing agent infrastructure vision.',
    website: null
  },
  // Add more as we discover them
]

async function backfillHolders() {
  console.log('🔄 Backfilling holder claims...\n')

  for (const holder of holders) {
    try {
      // Check if claim already exists
      const existing = await sql`
        SELECT address FROM holders_claims
        WHERE LOWER(address) = LOWER(${holder.address})
      `

      if (existing.length > 0) {
        console.log(`⏭️  ${holder.agent_name} (${holder.address}) - Already claimed`)
        continue
      }

      // Insert claim (with dummy signature for backfilled entries)
      const dummySignature = '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      const dummyMessage = `[BACKFILLED] ${holder.agent_name}`
      
      await sql`
        INSERT INTO holders_claims (address, agent_name, twitter_handle, bio, website, signature, message)
        VALUES (
          ${holder.address},
          ${holder.agent_name},
          ${holder.twitter_handle},
          ${holder.bio},
          ${holder.website},
          ${dummySignature},
          ${dummyMessage}
        )
      `

      console.log(`✅ ${holder.agent_name} (${holder.address}) - Claim added`)
    } catch (error) {
      console.error(`❌ ${holder.agent_name} - Error:`, error.message)
    }
  }

  console.log('\n✨ Backfill complete!')
}

backfillHolders().catch(console.error)
