# BankrBot Skill Pattern Analysis

Analysis of existing BankrBot skills to inform the Anons auction skill design.

## Analyzed Skills

1. **erc-8004** - Agent identity registration
2. **yoink** - Onchain game with auction-like mechanics
3. **bankr** - Core wallet and transaction infrastructure

---

## Common Patterns

### 1. Skill File Structure

All skills follow this structure:

```
skill-name/
├── SKILL.md           # Main documentation with frontmatter
├── scripts/           # Executable helper scripts
│   ├── primary.sh     # Main action script
│   ├── check.sh       # Status/verification scripts
│   └── util.sh        # Utilities
└── references/        # Optional detailed docs
    └── topic.md
```

### 2. Frontmatter Format

Every SKILL.md starts with YAML frontmatter:

```yaml
---
name: skill-name
description: Brief description for LLM context
metadata:
  clawdbot:
    emoji: "🔥"
    homepage: "https://..."
    requires:
      bins: ["curl", "jq"]
---
```

**Key fields:**
- `name`: Kebab-case skill identifier
- `description`: Used by LLM to determine when to invoke skill
- `metadata.clawdbot.requires.bins`: Dependencies (typically `curl` and `jq`)

### 3. Script Patterns

#### Shell Script Standards

All scripts use:

```bash
#!/bin/bash
set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${HOME}/.clawdbot/skills/bankr/config.json"
```

#### Configuration Management

Skills read from `~/.clawdbot/skills/bankr/config.json`:

```json
{
  "apiKey": "bk_...",
  "apiUrl": "https://api.bankr.bot"
}
```

Access via:

```bash
API_KEY=$(jq -r '.apiKey' "$CONFIG_FILE")
```

#### RPC Interaction Pattern (erc-8004, yoink)

For reading blockchain state:

```bash
RPC_URL="https://mainnet.base.org"
CONTRACT_ADDRESS="0x..."

# Encode function call
SELECTOR="0x70a08231"  # balanceOf(address)
PARAMS="000000000000000000000000abcd..."  # Padded address

# Make RPC call
RESPONSE=$(curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"eth_call\",
    \"params\": [{
      \"to\": \"$CONTRACT_ADDRESS\",
      \"data\": \"${SELECTOR}${PARAMS}\"
    }, \"latest\"],
    \"id\": 1
  }")

# Parse result
RESULT=$(echo "$RESPONSE" | jq -r '.result')
VALUE=$((16#${RESULT#0x}))  # Hex to decimal
```

**Key observations:**
- Direct RPC calls, no ethers.js/web3 dependencies
- Manual ABI encoding (selectors + padded params)
- `jq` for JSON parsing

#### Bankr Transaction Pattern (yoink, bankr)

For writing to blockchain:

```bash
# Build transaction JSON
TX_JSON=$(cat << EOF
{
  "to": "$CONTRACT_ADDRESS",
  "data": "$CALLDATA",
  "value": "$VALUE_WEI",
  "chainId": 8453
}
EOF
)

# Submit via Bankr
RESPONSE=$(curl -s -X POST "https://api.bankr.bot/agent/submit" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction\": $TX_JSON,
    \"waitForConfirmation\": true
  }")

# Parse response
TX_HASH=$(echo "$RESPONSE" | jq -r '.transactionHash // .txHash // .hash')
```

**Key observations:**
- Arbitrary transaction submission via `/agent/submit`
- `waitForConfirmation: true` for synchronous confirmation
- Multiple possible response fields for tx hash (fallback pattern)

### 4. Error Handling

Skills use consistent error patterns:

```bash
# Check prerequisites
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Bankr not configured"
  echo "Setup: <instructions>"
  exit 1
fi

# Check API responses
if echo "$RESPONSE" | jq -e '.error' > /dev/null; then
  echo "❌ $(echo "$RESPONSE" | jq -r '.error')"
  exit 1
fi

# Validate state
if [ "$SOME_CHECK" != "expected" ]; then
  echo "❌ State invalid"
  exit 1
fi
```

**Conventions:**
- ✅ for success messages
- ❌ for errors
- → for progress/action messages
- ⚠️ for warnings
- ℹ️ for info

### 5. User Interaction

Skills provide multiple invocation modes:

1. **Direct CLI**: `scripts/action.sh [args]`
2. **Natural language**: Agent interprets SKILL.md and calls scripts
3. **Status checks**: Read-only queries for decision-making

**Example from yoink:**

```bash
# Simple action
scripts/yoink.sh

# Check before action
scripts/check-cooldown.sh

# View state
scripts/game-status.sh
```

---

## Integration with Bankr Wallet

### How Bankr Manages Wallets

1. **Automatic provisioning**: Signup creates EVM + Solana wallets
2. **API key access**: Skills use API key, not private keys
3. **Chain support**: Base, Ethereum, Polygon, Unichain, Solana
4. **Transaction types**:
   - Natural language: `/agent/submit` with `prompt`
   - Arbitrary: `/agent/submit` with `transaction` object

### Why This Works for Anons

Anons auction checks:

```solidity
// Auction contract checks:
require(ERC8004Registry.balanceOf(msg.sender) > 0, "Not registered");
```

When Bankr submits a transaction:
- `msg.sender` = Bankr's EVM wallet for that agent
- If that wallet is registered in ERC-8004, the check passes

**Flow:**

1. Agent registers their Bankr Base wallet with ERC-8004
2. Script encodes `createBid(anonId)` call
3. Bankr signs + submits with agent's wallet
4. Auction contract sees registered address → allows bid

---

## Key Takeaways for Anons Skill

### 1. Pre-Bid Verification

Must check BEFORE submitting bid:

```bash
# 1. ERC-8004 registration (blocking)
scripts/check-registration.sh

# 2. Auction state (active? ended? paused?)
scripts/auction-status.sh

# 3. Minimum bid calculation
scripts/calculate-min-bid.sh

# 4. Balance check (via Bankr API)
```

### 2. Transaction Encoding

```solidity
function createBid(uint256 anonId) external payable
```

Encodes to:

```bash
SELECTOR="0x454a2ab3"  # createBid(uint256)
ANON_ID_HEX=$(printf "%064x" $ANON_ID)
CALLDATA="${SELECTOR}${ANON_ID_HEX}"
```

Submit with `value` = bid amount in wei.

### 3. Auction Monitoring

Key contract view functions:

```solidity
auction() -> (anonId, amount, startTime, endTime, bidder, settled, isDusk)
paused() -> bool
reservePrice() -> uint256
minBidIncrementPercentage() -> uint256
```

All encodable as simple RPC `eth_call`s.

### 4. Error Messages

Common failures:

| Error | Cause | Script Should |
|-------|-------|---------------|
| "Agent not registered" | No ERC-8004 | Direct to 8004.org |
| "Auction expired" | Time >= endTime | Run settle script |
| "Must send more" | Bid too low | Recalculate minimum |

---

## Comparison: Yoink vs Anons

Both are auction-like mechanisms:

| Feature | Yoink | Anons |
|---------|-------|-------|
| **Action** | `yoink()` | `createBid(anonId)` |
| **State check** | `lastYoinkedAt()` | `auction()` |
| **Restriction** | 10min cooldown | ERC-8004 registration |
| **Payment** | No value | Bid amount (wei) |
| **Settlement** | Automatic | Manual call needed |

**Similarities:**
- Check contract state before action
- Encode simple function calls
- Submit via Bankr arbitrary tx
- Monitor for state changes

**Key difference:** Anons requires payment (`value` field) and ERC-8004 check.

---

## Recommendations

### 1. Script Organization

```
anons-auction/
├── SKILL.md
└── scripts/
    ├── check-registration.sh   # ERC-8004 verification
    ├── auction-status.sh        # Current auction details
    ├── calculate-min-bid.sh     # Min bid + balance check
    ├── bid.sh                   # Submit bid
    └── settle.sh                # Settle ended auction
```

### 2. SKILL.md Structure

Follow bankr pattern:

1. Quick Start (prerequisites, first command)
2. How It Works (auction mechanics)
3. Core Scripts (with examples)
4. Integration (how Bankr submission works)
5. Common Errors (troubleshooting)
6. Resources (links)

### 3. ERC-8004 Handling

**Option A: Check-only** (implemented)
- Script checks registration
- Directs user to 8004.org if not registered

**Option B: Auto-register** (future enhancement)
- Detect non-registration
- Offer to register via erc-8004 skill
- Requires bridging ETH to mainnet (cost: ~$10-20)

**Recommendation:** Start with Option A. Option B adds complexity and cost.

### 4. Balance Management

Agents need:
- **Minimum**: 0.01 ETH (reserve) + 0.001 ETH (gas)
- **Comfortable**: 0.05 ETH (competitive bidding)

Script should:
- Check balance before bid
- Warn if < 0.02 ETH remaining
- Suggest refill if insufficient

---

## Testing Checklist

Before submitting PR to BankrBot:

- [ ] All scripts executable (`chmod +x`)
- [ ] Scripts work on Base mainnet
- [ ] Error messages are clear
- [ ] Registration check functional
- [ ] Auction status parsing correct
- [ ] Bid encoding matches contract
- [ ] Settlement works
- [ ] SKILL.md examples tested
- [ ] No hardcoded private keys
- [ ] Dependencies documented (curl, jq)

---

**Conclusion:** The anons-auction skill follows established BankrBot patterns while introducing auction-specific logic (minimum bid calculation, time-based checks, ERC-8004 registration). All core functionality is implementable with existing Bankr infrastructure.
