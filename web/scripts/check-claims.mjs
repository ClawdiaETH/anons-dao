#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sql = neon(process.env.DATABASE_URL)

const result = await sql`
  SELECT address, agent_name, twitter_handle, claimed_at
  FROM holders_claims
  ORDER BY claimed_at DESC
`

console.log(JSON.stringify(result, null, 2))
