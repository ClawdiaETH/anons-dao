import { pgTable, serial, integer, varchar, boolean, bigint, timestamp, text, numeric, date, index } from 'drizzle-orm/pg-core'

/**
 * Auctions table - mirrors onchain auction state
 */
export const auctions = pgTable('auctions', {
  anonId: integer('anon_id').primaryKey(),
  amount: varchar('amount', { length: 78 }).notNull(), // wei as string
  startTime: bigint('start_time', { mode: 'bigint' }).notNull(),
  endTime: bigint('end_time', { mode: 'bigint' }).notNull(),
  bidder: varchar('bidder', { length: 42 }).notNull(),
  settled: boolean('settled').default(false).notNull(),
  isDusk: boolean('is_dusk').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  endTimeIdx: index('idx_auctions_end_time').on(table.endTime.desc()),
}))

/**
 * Bids table - all bids from AuctionBid events
 */
export const bids = pgTable('bids', {
  id: serial('id').primaryKey(),
  anonId: integer('anon_id').notNull(),
  bidder: varchar('bidder', { length: 42 }).notNull(),
  agentId: integer('agent_id'), // ERC-8004 agent ID (null if not registered)
  amount: varchar('amount', { length: 78 }).notNull(), // wei as string
  extended: boolean('extended').default(false).notNull(),
  blockNumber: bigint('block_number', { mode: 'bigint' }).notNull(),
  timestamp: bigint('timestamp', { mode: 'bigint' }).notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  anonIdIdx: index('idx_bids_anon_id').on(table.anonId),
  bidderIdx: index('idx_bids_bidder').on(table.bidder),
  agentIdIdx: index('idx_bids_agent_id').on(table.agentId),
  timestampIdx: index('idx_bids_timestamp').on(table.timestamp.desc()),
  blockNumberIdx: index('idx_bids_block_number').on(table.blockNumber.desc()),
}))

/**
 * Agents table - ERC-8004 agent metadata cache
 */
export const agents = pgTable('agents', {
  agentId: integer('agent_id').primaryKey(),
  wallet: varchar('wallet', { length: 42 }).unique().notNull(),
  twitterHandle: varchar('twitter_handle', { length: 255 }),
  ensName: varchar('ens_name', { length: 255 }),
  name: varchar('name', { length: 255 }),
  bio: text('bio'),
  verifiedAt: bigint('verified_at', { mode: 'bigint' }),
  totalBids: integer('total_bids').default(0).notNull(),
  totalSpent: varchar('total_spent', { length: 78 }).default('0').notNull(),
  anonsWon: integer('anons_won').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  walletIdx: index('idx_agents_wallet').on(table.wallet),
  twitterIdx: index('idx_agents_twitter').on(table.twitterHandle),
}))

/**
 * Stats table - daily aggregated metrics
 */
export const stats = pgTable('stats', {
  date: date('date').primaryKey(),
  totalAuctions: integer('total_auctions').default(0).notNull(),
  totalVolume: varchar('total_volume', { length: 78 }).default('0').notNull(),
  uniqueBidders: integer('unique_bidders').default(0).notNull(),
  avgBidsPerAuction: numeric('avg_bids_per_auction', { precision: 10, scale: 2 }).default('0').notNull(),
  treasuryBalance: varchar('treasury_balance', { length: 78 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
