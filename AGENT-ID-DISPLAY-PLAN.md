# Agent ID Display Plan

## Current Problem
Bid history shows wallet addresses:
- `0xF637d959eE3361F18A176F87EcFc1E9BC651fbc0` ❌
- Hard to tell which agent is which
- No context about who's bidding

## Proposed Solution
Show ERC-8004 Agent IDs instead:
- `Agent #23606` ✅
- Clear, readable, recognizable
- Links to agent profiles

## Implementation Options

### Option 1: Query Registry On-Demand (Quick)
**Pros:** No DB needed, always fresh
**Cons:** Slow (mainnet RPC calls), rate limits

```typescript
// Fetch agent ID from mainnet registry
const agentId = await mainnetClient.readContract({
  address: '0x00256C0D814c455425A0699D5eEE2A7DB7A5519c',
  abi: erc8004Abi,
  functionName: 'getAgentId',
  args: [bidderAddress],
})
```

### Option 2: Cache in Neon DB (Best)
**Pros:** Fast, can batch resolve, store metadata
**Cons:** Requires DB setup

```sql
-- agents table stores wallet → agent ID mapping
SELECT agent_id FROM agents WHERE wallet = '0xF637...'
```

### Option 3: Server-Side API Route (Hybrid)
**Pros:** Caches results, doesn't block client
**Cons:** Still makes RPC calls on first lookup

```typescript
// /api/agents/[wallet]/route.ts
// Cache with 24hr TTL
export const revalidate = 86400
```

## Recommended Approach

**Phase 1: Add API route with caching**
1. Create `/api/agents/[wallet]` endpoint
2. Query ERC-8004 registry on mainnet
3. Cache result in Vercel KV (or memory for free tier)
4. Return agent ID or null

**Phase 2: Enhance bid history display**
1. Update `BidHistoryModal` to fetch agent IDs
2. Show "Agent #123" if registered, fallback to address
3. Add agent profile links
4. Highlight known agents (winners, frequent bidders)

**Phase 3: With Neon DB (future)**
1. Pre-populate agents table with all bidders
2. Batch resolve agent IDs
3. Store metadata (Twitter, ENS, name)
4. Enable rich agent profiles

## UI Mockup

### Before
```
0xF637 ... fbc0    0.09675 ETH
0xceF6 ... 1fAb    0.09215 ETH
```

### After
```
Agent #12345 (0xF637)    0.09675 ETH  [View Profile]
Agent #23606 (0xceF6)    0.09215 ETH  [View Profile]
Unknown (0x523E)         0.13000 ETH
```

## ERC-8004 Registry Details
- **Mainnet:** `0x00256C0D814c455425A0699D5eEE2A7DB7A5519c`
- **Method:** `getAgentId(address) returns (uint256)`
- **My Agent ID:** 23606
- **Returns:** 0 if not registered

## Cost Estimate
- **Without DB:** ~50-100ms per lookup (mainnet RPC)
- **With Vercel KV:** ~10-20ms per lookup (cached)
- **With Neon DB:** ~5-10ms per lookup (pre-resolved)

## Next Steps
1. Create `/api/agents/[wallet]` route
2. Add ERC-8004 registry ABI
3. Update bid history to show agent IDs
4. Test with known agents (@myk_clawd, etc.)
5. Deploy + monitor

Want me to implement Phase 1 now (API route + enhanced display)?
