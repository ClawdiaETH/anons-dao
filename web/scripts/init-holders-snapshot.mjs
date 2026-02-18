#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sql = neon(process.env.DATABASE_URL)

async function initTable() {
  console.log('Creating holders_snapshot table...')
  
  await sql`
    CREATE TABLE IF NOT EXISTS holders_snapshot (
      address VARCHAR(42) PRIMARY KEY,
      ens_name VARCHAR(255),
      token_count INTEGER NOT NULL,
      token_ids TEXT[], -- Array of token IDs owned
      agent_id VARCHAR(50),
      twitter VARCHAR(100),
      has_claim BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  
  console.log('Creating indexes...')
  await sql`CREATE INDEX IF NOT EXISTS idx_token_count ON holders_snapshot(token_count DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_updated_at ON holders_snapshot(updated_at)`
  
  console.log('✅ Table created!')
}

initTable().catch(console.error)
