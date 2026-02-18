#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'

const sql = neon('postgresql://neondb_owner:npg_6QxIDE7dMnvp@ep-fancy-shape-aimqj22i.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require')

const result = await sql`
  SELECT address, agent_name, twitter_handle, claimed_at
  FROM holders_claims
  ORDER BY claimed_at DESC
`

console.log(JSON.stringify(result, null, 2))
