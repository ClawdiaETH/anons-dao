## ERC-8004 Integration Research

Research findings on integrating ERC-8004 agent registry with Bankr wallets and Anons DAO auctions.

---

## Overview

**ERC-8004** is an Ethereum standard for trustless agent identity and reputation. Anons DAO requires bidders to be registered agents.

**Spec:** https://eips.ethereum.org/EIPS/eip-8004  
**Website:** https://www.8004.org

---

## Registry Deployments

### Ethereum Mainnet (Original)

| Contract | Address |
|----------|---------|
| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

**Cost:** ~$10-20 in gas for registration (Ethereum mainnet gas fees)

### Base Mainnet (Anons DAO)

| Contract | Address |
|----------|---------|
| Identity Registry | `0x00256C0D814c455425A0699D5eEE2A7DB7A5519c` |

**Cost:** <$1 in gas for registration (Base L2 fees)

**⚠️ CRITICAL:** Anons DAO uses the **Base deployment**, not Ethereum mainnet.

---

## Registration Process

### Method 1: Web UI (Easiest)

Visit https://www.8004.org and connect wallet:

1. Connect Bankr wallet (via WalletConnect or direct)
2. Fill in agent profile (name, description, image)
3. Upload to IPFS (handled by site)
4. Sign registration transaction
5. Receive Agent ID NFT

**Pros:**
- No CLI required
- IPFS handled automatically
- Visual confirmation

**Cons:**
- Manual process (not scriptable)
- Requires browser interaction

### Method 2: CLI via BankrBot erc-8004 Skill

If the erc-8004 skill is installed:

```bash
# Register on Ethereum mainnet
NAME="Agent Name" DESCRIPTION="..." IMAGE="https://..." \
  ~/.clawdbot/skills/erc-8004/scripts/register.sh

# Then bridge to Base (if needed)
```

**Pros:**
- Scriptable
- Can be invoked by AI agent

**Cons:**
- Ethereum mainnet costs (~$10-20)
- Requires bridging if Anons is on Base
- Multiple transactions (register + bridge)

### Method 3: Direct Contract Call on Base

Programmatically register on Base:

```solidity
function register(string memory agentURI) external returns (uint256)
```

Where `agentURI` can be:
- IPFS URL: `ipfs://Qm...`
- HTTP URL: `https://example.com/agent.json`
- Data URI: `data:application/json;base64,...`

**Implementation:**

```bash
# Encode register(string)
SELECTOR="0x82fbdc9c"  # register(string)

# Encode string parameter (complex, requires length prefix + data)
# Easier to use cast or ethers.js for encoding

# Submit via Bankr
curl -X POST "https://api.bankr.bot/agent/submit" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "transaction": {
      "to": "0x00256C0D814c455425A0699D5eEE2A7DB7A5519c",
      "data": "<encoded_calldata>",
      "value": "0",
      "chainId": 8453
    }
  }'
```

**Pros:**
- Base gas fees (<$1)
- Fully programmable

**Cons:**
- Complex string encoding
- Need to host agent.json somewhere (IPFS, HTTP, or base64)

---

## Agent Profile Format

The `agentURI` must point to JSON matching this schema:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Agent Name",
  "description": "What the agent does",
  "image": "https://example.com/avatar.png",
  "services": [
    {
      "name": "web",
      "endpoint": "https://agent.example.com"
    }
  ],
  "x402Support": false,
  "active": true,
  "registrations": [
    {
      "agentId": 123,
      "agentRegistry": "eip155:8453:0x00256C0D814c455425A0699D5eEE2A7DB7A5519c"
    }
  ],
  "supportedTrust": ["reputation"]
}
```

**Minimum required fields:**
- `type`
- `name`

---

## Bankr Wallet Registration

### Can Bankr Wallets Register?

**YES.** Bankr wallets are standard EVM EOAs (Externally Owned Accounts) and can interact with any smart contract.

### Registration Flow for Bankr Users

1. **Get wallet address**:
   ```bash
   curl "https://api.bankr.bot/agent/submit" \
     -H "X-API-Key: $API_KEY" \
     -d '{"prompt": "What is my Base wallet address?"}'
   ```

2. **Host agent profile**:
   - Option A: Use data URI (fully onchain)
   - Option B: Upload to IPFS via Pinata
   - Option C: Host on static site

3. **Submit registration transaction**:
   ```bash
   # Via Bankr arbitrary transaction
   {
     "to": "0x00256C0D814c455425A0699D5eEE2A7DB7A5519c",
     "data": "0x82fbdc9c<encoded_uri>",
     "value": "0",
     "chainId": 8453
   }
   ```

4. **Verify registration**:
   ```bash
   # Check balanceOf(address)
   # If > 0, registered
   ```

### Challenges

1. **String encoding complexity**: `register(string)` requires proper ABI encoding
   - Length prefix (32 bytes)
   - Offset (32 bytes)
   - String data (padded to 32-byte chunks)

2. **Profile hosting**: Where to store agent.json?
   - **IPFS**: Requires Pinata account
   - **HTTP**: Requires web hosting
   - **Data URI**: Large calldata (expensive gas)

3. **Discovery**: How do users know their agent ID after registration?
   - Parse `AgentRegistered` event
   - Query `balanceOf(address)` (returns 1 if registered)
   - Query `tokenOfOwnerByIndex(address, 0)` for agent ID

---

## Verification Methods

### Method 1: balanceOf Check (Simplest)

```solidity
function balanceOf(address owner) external view returns (uint256)
```

If `balanceOf(address) > 0`, the address owns an agent NFT = registered.

**Implementation:**

```bash
RPC_URL="https://mainnet.base.org"
REGISTRY="0x00256C0D814c455425A0699D5eEE2A7DB7A5519c"
AGENT_ADDRESS="0x..."

# Encode balanceOf(address)
SELECTOR="0x70a08231"
PARAMS=$(echo "$AGENT_ADDRESS" | sed 's/0x//' | awk '{printf "000000000000000000000000%s", tolower($0)}')

# RPC call
curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$REGISTRY\",\"data\":\"0x${SELECTOR}${PARAMS}\"},\"latest\"],\"id\":1}" \
  | jq -r '.result'

# Result: 0x0000...0001 = registered, 0x0000...0000 = not registered
```

**Pros:**
- Single RPC call
- Simple boolean result
- Works for all registered agents

**Cons:**
- Doesn't return agent ID

### Method 2: tokenOfOwnerByIndex (Get Agent ID)

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)
```

Returns the agent ID (token ID) at given index for owner.

**Usage:**

```bash
# Get first (index 0) agent ID for address
SELECTOR="0x2f745c59"
PARAMS="<address_padded><index_padded>"

# Result: Agent ID (token ID)
```

**Pros:**
- Returns actual agent ID
- Can enumerate multiple IDs if owner has >1

**Cons:**
- Reverts if owner has no agents (must check balanceOf first)

---

## Integration Strategies

### Strategy A: Check-Only (Recommended for MVP)

**What it does:**
- Verify agent is registered before bidding
- Direct user to 8004.org if not registered

**Pros:**
- Simple implementation
- No cost to skill (user pays for registration)
- Uses existing infrastructure

**Cons:**
- Manual registration step
- Requires user to understand ERC-8004

**Implementation:**

```bash
# In bid.sh, add pre-flight check:
if ! scripts/check-registration.sh; then
  echo "❌ Not registered"
  echo "Register at: https://www.8004.org"
  exit 1
fi
```

### Strategy B: Guided Registration

**What it does:**
- Detect non-registration
- Walk user through registration process
- Use Bankr to submit registration transaction

**Pros:**
- Smoother UX
- Agent can complete full flow

**Cons:**
- Complex string encoding
- Need profile hosting solution
- Multiple steps

**Implementation:**

```bash
# In bid.sh:
if ! check_registered; then
  echo "→ Not registered. Starting registration..."
  
  # 1. Generate profile JSON
  # 2. Upload to IPFS or create data URI
  # 3. Encode register(string) call
  # 4. Submit via Bankr
  # 5. Wait for confirmation
  # 6. Verify registration
  # 7. Proceed to bid
fi
```

### Strategy C: Delegation (Future Enhancement)

**What it does:**
- Invoke BankrBot's erc-8004 skill if available
- Delegate registration to that skill

**Pros:**
- Reuses existing code
- Single source of truth for registration

**Cons:**
- Skill dependency
- Ethereum mainnet vs Base distinction

**Implementation:**

```bash
if ! check_registered; then
  if command -v ~/.clawdbot/skills/erc-8004/scripts/register.sh &> /dev/null; then
    echo "→ Registering via erc-8004 skill..."
    ~/.clawdbot/skills/erc-8004/scripts/register.sh --chain base
  else
    echo "❌ Not registered. Install erc-8004 skill or visit https://www.8004.org"
    exit 1
  fi
fi
```

---

## Recommendation

**For initial PR:** Strategy A (Check-Only)

**Rationale:**
1. **Simplicity**: Minimal code complexity, easy to review
2. **Cost**: No additional gas costs for skill
3. **Reliability**: Uses proven registration methods (8004.org, existing skill)
4. **Maintainability**: No need to handle IPFS/encoding edge cases

**Future enhancements:**
1. Add Strategy B (guided registration) once encoding is stable
2. Support data URIs for fully onchain profiles
3. Integrate with erc-8004 skill when deployed to Base

---

## Open Questions

### 1. Do Bankr wallets persist across API keys?

**Answer needed:** If user rotates API key, do they get the same wallet or a new one?

**Impact:** If new wallet, need to re-register with each key rotation.

**Mitigation:** Document wallet persistence behavior in SKILL.md

### 2. Can we relax the ERC-8004 check for Bankr-verified agents?

**Proposal:** Since Bankr provides Twitter-based identity verification, could Anons DAO accept:
- ERC-8004 registered agents, OR
- Bankr-verified agents (via some whitelist/merkle proof)?

**Pros:**
- Lower barrier to entry
- Leverages Bankr's existing identity layer

**Cons:**
- Requires Anons DAO governance change
- Centralization concern (trusting Bankr)

**Recommendation:** Keep ERC-8004 requirement for now. Bankr identity is social-based, not cryptographic.

### 3. Should we auto-register on first bid attempt?

**Proposal:** If user tries to bid and isn't registered:
1. Pause bid flow
2. Auto-generate profile (name = Twitter handle, image = PFP)
3. Upload to IPFS or use data URI
4. Register
5. Resume bid

**Pros:**
- Seamless UX
- One-click participation

**Cons:**
- Complex error handling
- Gas cost surprise (~$0.50 registration + bid)
- Profile generation assumptions

**Recommendation:** Phase 2 feature after MVP proven.

---

## Conclusion

**ERC-8004 integration is straightforward:**

1. ✅ **Bankr wallets CAN register** — they're standard EOAs
2. ✅ **Base registry exists** — `0x00256C0D814c455425A0699D5eEE2A7DB7A5519c`
3. ✅ **Verification is simple** — Single `balanceOf()` RPC call
4. ✅ **Check-only strategy works** — Direct users to 8004.org

**Recommended approach:**
- MVP: Check registration, direct to 8004.org if needed
- Future: Guided registration with data URIs
- Long-term: Full integration with erc-8004 skill

**No blockers** — skill can launch with check-only implementation.
