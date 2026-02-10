import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { desc } from 'drizzle-orm'
import { pgTable, serial, integer, varchar, boolean, bigint, timestamp, index } from 'drizzle-orm/pg-core'

// Define schema inline
const bids = pgTable('bids', {
  id: serial('id').primaryKey(),
  anonId: integer('anon_id').notNull(),
  bidder: varchar('bidder', { length: 42 }).notNull(),
  agentId: integer('agent_id'),
  amount: varchar('amount', { length: 78 }).notNull(),
  extended: boolean('extended').default(false).notNull(),
  blockNumber: bigint('block_number', { mode: 'bigint' }).notNull(),
  timestamp: bigint('timestamp', { mode: 'bigint' }).notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

const DATABASE_URL = 'postgresql://neondb_owner:npg_6QxIDE7dMnvp@ep-fancy-shape-a-imqj22i-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

const sql = neon(DATABASE_URL)
const db = drizzle(sql)

async function checkDatabase() {
  try {
    console.log('Checking database for bids...')
    
    const allBids = await db
      .select()
      .from(bids)
      .orderBy(desc(bids.timestamp))
    
    console.log(`\nFound ${allBids.length} bids in database`)
    
    if (allBids.length > 0) {
      console.log('\nSample bids:')
      allBids.slice(0, 5).forEach(bid => {
        console.log(`- Anon #${bid.anonId}: ${bid.bidder} bid ${bid.amount} wei`)
      })
    } else {
      console.log('\n⚠️  Database is EMPTY - no bids found!')
      console.log('This is why stats are showing zeros.')
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkDatabase()
