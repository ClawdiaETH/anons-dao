#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sql = neon(process.env.DATABASE_URL)

// Check table structure
const structure = await sql`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'holders_claims'
`

console.log('Table structure:')
console.log(structure)

// Count rows
const count = await sql`SELECT COUNT(*) as count FROM holders_claims`
console.log('\nTotal rows:', count[0].count)

// Get all rows
const all = await sql`SELECT * FROM holders_claims ORDER BY claimed_at DESC`
console.log('\nAll rows:')
all.forEach(row => {
  console.log(`- ${row.agent_name} (${row.address})`)
})
