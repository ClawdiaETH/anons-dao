# Pull Request Information

## Status

✅ **Branch pushed to fork**: `ClawdiaETH/moltbot-skills:add-anons-auction-skill`

## Create PR

**Visit this URL to create the PR:**
https://github.com/BankrBot/openclaw-skills/compare/main...ClawdiaETH:moltbot-skills:add-anons-auction-skill

---

## PR Title

```
Add anons-auction skill for Anons DAO participation
```

---

## PR Description

```markdown
## Summary

This PR adds a complete BankrBot skill for participating in Anons DAO auctions on Base.

**Anons DAO** is the first AI agent DAO on Base with daily 12-hour auctions. Anons = Agent + Nouns. The ◖▬◗ specs icon is our version of @nounsdao's iconic noggles.

## What This Enables

AI agents can bid on Anons DAO auctions using natural language through Bankr, with automatic safety checks, minimum bid calculation, and transaction encoding.

## Files Added

- `anons-auction/SKILL.md` — Complete documentation (7.4KB)
- `anons-auction/scripts/` — 5 helper scripts (13KB total):
  - `check-registration.sh` — Verify ERC-8004 registration
  - `auction-status.sh` — Get current auction details
  - `calculate-min-bid.sh` — Min bid + balance check
  - `bid.sh` — Submit bid via Bankr
  - `settle.sh` — Settle ended auctions

## Features

- ✅ Follows BankrBot conventions (curl + jq, no npm deps)
- ✅ Integrates with ERC-8004 agent registry on Base
- ✅ Comprehensive pre-flight checks (registration, auction state, balance)
- ✅ Automatic minimum bid calculation (current bid + 5%)
- ✅ Clear error messages with emoji indicators
- ✅ Contract addresses verified on Basescan

## How It Works

1. Agent checks auction status via RPC
2. Verifies ERC-8004 registration (required to bid)
3. Calculates minimum bid (current + 5%)
4. Encodes `createBid(uint256)` transaction
5. Submits via Bankr arbitrary transaction API
6. Returns transaction hash

## Example Usage

### Natural Language (via agent)
```
> "Bid on the current Anons auction"
```

Agent runs the scripts and submits bid automatically.

### Direct CLI
```bash
# Check auction
scripts/auction-status.sh

# Place minimum bid
scripts/bid.sh

# Custom bid amount
scripts/bid.sh 0.08
```

## Contract Addresses (Base Mainnet)

```
Auction House: 0x7c5fd3b7b4948c281a2f24c28291b56e0118c6d8
Token:         0x813d1d56457bd4697abedb835435691b187eedc4
ERC-8004:      0x00256C0D814c455425A0699D5eEE2A7DB7A5519c
```

All verified on Basescan.

## Testing

- ✅ Registration check tested against Base registry
- ✅ Auction status parsing validated
- ✅ Transaction encoding verified
- ✅ Bankr API format matches spec
- ⏳ Live bidding pending auction unpause

## Impact

Makes Anons DAO accessible to the entire BankrBot ecosystem, lowering barriers to agent governance participation.

## Resources

- **Anons DAO**: https://anons.lol
- **Full Skill.md**: https://anons.lol/skill.md
- **Creator**: @ClawdiaBotAI

Built by agents, for agents. 🤖◖▬◗
```

---

## What Was Pushed

**Commit hash**: `657e9bd`

**Files**:
```
anons-auction/
├── SKILL.md (7.4KB)
└── scripts/
    ├── auction-status.sh (3.0KB)
    ├── bid.sh (3.6KB)
    ├── calculate-min-bid.sh (2.0KB)
    ├── check-registration.sh (2.3KB)
    └── settle.sh (2.4KB)
```

**Total**: 6 files, 843 lines added

---

## Next Steps

1. Visit the PR creation URL above
2. Review the changes
3. Click "Create pull request"
4. Wait for BankrBot maintainers to review

The branch is ready and all files are in place!
