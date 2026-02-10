# Neon DB Integration Plan

## Why Neon DB?
**Problem:** Every page load queries Base RPC multiple times (auction data, bid history, stats)
**Solution:** Cache data in PostgreSQL, update via background job

## Benefits
1. **10-100x faster queries** - DB << RPC latency
2. **Richer features** - agent leaderboards, historical stats, trends
3. **Reduced RPC costs** - 90% fewer calls
4. **Better UX** - instant bid history, agent profiles
5. **Metadata storage** - agent Twitter handles, ENS names, bios

## Schema Design

### `auctions` table
```sql
CREATE TABLE auctions (
  anon_id INT PRIMARY KEY,
  amount NUMERIC(78, 0), -- wei
  start_time BIGINT,
  end_time BIGINT,
  bidder VARCHAR(42),
  settled BOOLEAN,
  is_dusk BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auctions_end_time ON auctions(end_time DESC);
```

### `bids` table
```sql
CREATE TABLE bids (
  id SERIAL PRIMARY KEY,
  anon_id INT REFERENCES auctions(anon_id),
  bidder VARCHAR(42) NOT NULL,
  agent_id INT, -- ERC-8004 agent ID
  amount NUMERIC(78, 0) NOT NULL,
  extended BOOLEAN DEFAULT FALSE,
  block_number BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bids_anon_id ON bids(anon_id);
CREATE INDEX idx_bids_bidder ON bids(bidder);
CREATE INDEX idx_bids_agent_id ON bids(agent_id);
CREATE INDEX idx_bids_timestamp ON bids(timestamp DESC);
```

### `agents` table (metadata cache)
```sql
CREATE TABLE agents (
  agent_id INT PRIMARY KEY,
  wallet VARCHAR(42) UNIQUE NOT NULL,
  twitter_handle VARCHAR(255),
  ens_name VARCHAR(255),
  name VARCHAR(255),
  bio TEXT,
  verified_at BIGINT,
  total_bids INT DEFAULT 0,
  total_spent NUMERIC(78, 0) DEFAULT 0,
  anons_won INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_wallet ON agents(wallet);
CREATE INDEX idx_agents_twitter ON agents(twitter_handle);
```

### `stats` table (aggregated metrics)
```sql
CREATE TABLE stats (
  date DATE PRIMARY KEY,
  total_auctions INT,
  total_volume NUMERIC(78, 0),
  unique_bidders INT,
  avg_bids_per_auction NUMERIC(10, 2),
  treasury_balance NUMERIC(78, 0),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Plan

### Phase 1: Basic Caching (1-2 hours)
1. Set up Neon DB (Vercel integration)
2. Create tables + indexes
3. Build `/api/sync` endpoint (fetches from RPC → writes to DB)
4. Update `/api/bids/[anonId]` to query DB instead of RPC
5. Cron job: sync every 30 seconds

**Result:** 10x faster bid history, reduced RPC load

### Phase 2: Agent Enrichment (2-3 hours)
1. Add ERC-8004 registry queries
2. Resolve agent IDs for all bidders
3. Store in `agents` table
4. Display agent IDs in bid history
5. Add agent profile pages (`/agent/[id]`)

**Result:** Bid history shows "Agent #23606" instead of "0xF637...fbc0"

### Phase 3: Advanced Features (future)
- Agent leaderboards (most wins, highest volume)
- Historical charts (auction prices over time)
- Agent activity feeds
- Wallet → Twitter handle resolution
- Real-time stats dashboard

## Cost Estimate
- **Neon Free Tier:** 0.5 GB storage, 191 compute hours/month
- **Expected usage:** <100 MB data, ~10 hours compute/month
- **Cost:** $0 (free tier sufficient)

## Performance Impact
| Metric | Before (RPC) | After (Neon) |
|--------|--------------|--------------|
| Bid history query | 2-5s | 50-200ms |
| Agent lookup | N/A | 10-50ms |
| Historical stats | N/A | 20-100ms |
| RPC calls/page | 5-10 | 1-2 |

## Risks
1. **Sync lag:** DB could be 30s behind chain
   - Mitigation: Show "last updated" timestamp
2. **Stale data:** Users see old bids
   - Mitigation: Client hooks still watch chain events
3. **Maintenance:** Need sync job monitoring
   - Mitigation: Vercel Cron + error alerts

## Next Steps
1. Jake creates Neon project + shares connection string
2. I implement Phase 1 (basic caching)
3. Test with real auction data
4. Deploy + monitor
5. Iterate to Phase 2 (agent enrichment)
