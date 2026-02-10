import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

const sql = neon(DATABASE_URL)

/**
 * Initialize database schema
 * Run this once to set up tables and indexes
 */
export async function migrate() {
  console.log('🔄 Running database migrations...')

  // Create auctions table
  await sql`
    CREATE TABLE IF NOT EXISTS auctions (
      anon_id INTEGER PRIMARY KEY,
      amount VARCHAR(78) NOT NULL,
      start_time BIGINT NOT NULL,
      end_time BIGINT NOT NULL,
      bidder VARCHAR(42) NOT NULL,
      settled BOOLEAN DEFAULT FALSE NOT NULL,
      is_dusk BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `
  console.log('✅ Created auctions table')

  await sql`
    CREATE INDEX IF NOT EXISTS idx_auctions_end_time 
    ON auctions(end_time DESC)
  `
  console.log('✅ Created auctions indexes')

  // Create bids table
  await sql`
    CREATE TABLE IF NOT EXISTS bids (
      id SERIAL PRIMARY KEY,
      anon_id INTEGER NOT NULL,
      bidder VARCHAR(42) NOT NULL,
      agent_id INTEGER,
      amount VARCHAR(78) NOT NULL,
      extended BOOLEAN DEFAULT FALSE NOT NULL,
      block_number BIGINT NOT NULL,
      timestamp BIGINT NOT NULL,
      tx_hash VARCHAR(66),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `
  console.log('✅ Created bids table')

  await sql`
    CREATE INDEX IF NOT EXISTS idx_bids_anon_id ON bids(anon_id)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_bids_agent_id ON bids(agent_id)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_bids_timestamp ON bids(timestamp DESC)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_bids_block_number ON bids(block_number DESC)
  `
  console.log('✅ Created bids indexes')

  // Create agents table
  await sql`
    CREATE TABLE IF NOT EXISTS agents (
      agent_id INTEGER PRIMARY KEY,
      wallet VARCHAR(42) UNIQUE NOT NULL,
      twitter_handle VARCHAR(255),
      ens_name VARCHAR(255),
      name VARCHAR(255),
      bio TEXT,
      verified_at BIGINT,
      total_bids INTEGER DEFAULT 0 NOT NULL,
      total_spent VARCHAR(78) DEFAULT '0' NOT NULL,
      anons_won INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `
  console.log('✅ Created agents table')

  await sql`
    CREATE INDEX IF NOT EXISTS idx_agents_wallet ON agents(wallet)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_agents_twitter ON agents(twitter_handle)
  `
  console.log('✅ Created agents indexes')

  // Create stats table
  await sql`
    CREATE TABLE IF NOT EXISTS stats (
      date DATE PRIMARY KEY,
      total_auctions INTEGER DEFAULT 0 NOT NULL,
      total_volume VARCHAR(78) DEFAULT '0' NOT NULL,
      unique_bidders INTEGER DEFAULT 0 NOT NULL,
      avg_bids_per_auction NUMERIC(10, 2) DEFAULT 0 NOT NULL,
      treasury_balance VARCHAR(78) DEFAULT '0' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `
  console.log('✅ Created stats table')

  console.log('✨ All migrations completed successfully!')
}

// Run migrations if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ Migration complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    })
}
