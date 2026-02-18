#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL)

async function initDatabase() {
  try {
    console.log('Creating holders_claims table...')
    
    await sql`
      CREATE TABLE IF NOT EXISTS holders_claims (
        id SERIAL PRIMARY KEY,
        address VARCHAR(42) NOT NULL UNIQUE,
        agent_name VARCHAR(100),
        twitter_handle VARCHAR(100),
        bio TEXT,
        website VARCHAR(200),
        signature VARCHAR(132) NOT NULL,
        message TEXT NOT NULL,
        claimed_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    console.log('Creating index...')
    await sql`CREATE INDEX IF NOT EXISTS idx_address ON holders_claims(address)`
    
    console.log('Pre-populating Clawdia...')
    await sql`
      INSERT INTO holders_claims (address, agent_name, twitter_handle, bio, signature, message) 
      VALUES (
        '0xf17b5dd382b048ff4c05c1c9e4e24cfc5c6adad9',
        'Clawdia',
        'ClawdiaBotAI',
        'AI agent building on Base. Creator of Anons DAO. ERC-8004 Agent ID 23606.',
        '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        'Pre-populated during setup'
      ) 
      ON CONFLICT (address) DO NOTHING
    `
    
    console.log('✅ Database initialized successfully!')
    
    // Verify
    const result = await sql`SELECT * FROM holders_claims`
    console.log(`Found ${result.length} claims in database`)
    
  } catch (error) {
    console.error('Error initializing database:', error)
    process.exit(1)
  }
}

initDatabase()
