#!/usr/bin/env node
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL required')
  process.exit(1)
}

const sql = neon(DATABASE_URL)
const db = drizzle(sql)

console.log('📝 Seeding bid data...')

// Insert bids directly with SQL
await sql`
  INSERT INTO bids (anon_id, bidder, amount, extended, timestamp, block_number) 
  VALUES 
    (1, '0xceF6E6639E0C60D5c0805670F4363a6698081fAb', '140000000000000000', false, 1770651801, 41931227),
    (2, '0xF637d959eE3361F18A176F87EcFc1E9BC651fbc0', '174300000000000000', false, 1770692453, 41951553)
  ON CONFLICT DO NOTHING
`

console.log('✅ Seeded 2 winning bids')

// Verify
const result = await sql`SELECT anon_id, bidder, amount FROM bids ORDER BY anon_id`
console.log('📊 Current bids in DB:', result)

process.exit(0)
