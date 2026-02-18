#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sql = neon(process.env.DATABASE_URL)

async function initTables() {
  console.log('Creating events table...')
  
  await sql`
    CREATE TABLE IF NOT EXISTS anons_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      event_data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      blockchain_tx VARCHAR(66)
    )
  `
  
  console.log('Creating indexes...')
  await sql`CREATE INDEX IF NOT EXISTS idx_event_type ON anons_events(event_type)`
  await sql`CREATE INDEX IF NOT EXISTS idx_created_at ON anons_events(created_at DESC)`
  
  console.log('Adding webhook_url to holders_claims...')
  await sql`
    ALTER TABLE holders_claims 
    ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS webhook_events TEXT[]
  `
  
  console.log('✅ Tables created!')
}

initTables().catch(console.error)
