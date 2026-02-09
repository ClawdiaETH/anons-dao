# Anons DAO Security Action Plan

**Date:** 2026-02-08
**Based on:** Security Audit Report by Claude Opus 4.6

---

## Status: 🚨 PRE-LAUNCH - DO NOT UNPAUSE UNTIL COMPLETE

**Critical blockers:**
- [ ] Quorum = 1 (single token can drain treasury)
- [ ] Exposed API keys in repo
- [ ] Git history not purged
- [ ] ERC-8004 bypass via proxy contracts

---

## Phase 1: IMMEDIATE (Before Any Mainnet Activity)

### 1.1 Rotate ALL Exposed Credentials ⚠️ URGENT
- [ ] **Alchemy API key**: `***REMOVED_ALCHEMY_KEY***` (exposed in 5+ files)
- [ ] **Basescan API key**: `***REMOVED_BASESCAN_KEY***` (in .env.example + docs)
- [ ] **Private key**: `0x7bec...1891` (partial exposed in docs)
- [ ] Generate new keys in respective dashboards
- [ ] Update all deployment scripts/env files
- [ ] Test with new credentials

**Estimated time:** 1 hour

### 1.2 Purge Git History 🔥 CRITICAL
- [ ] Install BFG Repo Cleaner: `brew install bfg`
- [ ] Clone fresh copy: `git clone --mirror <repo-url>`
- [ ] Run BFG: `bfg --delete-files '.env*' --delete-files '*secrets*'`
- [ ] Force push: `git push --force --all`
- [ ] **WARN ALL COLLABORATORS** - they must re-clone

**Estimated time:** 30 minutes

### 1.3 Replace .env.example with Placeholders
- [ ] Replace all live keys with `YOUR_*_API_KEY`
- [ ] Add clear comments explaining where to get keys
- [ ] Remove all real addresses/keys from examples
- [ ] Commit cleaned version

**Files to fix:**
- `web/.env.example`
- `DEPLOYMENT_STATUS.md`
- `TESTNET_DEPLOYMENT.md`
- `FINAL_DEPLOYMENT_REPORT.md`
- `SECURITY_AUDIT_FIXES.md`
- `MAINNET_ADDRESSES.md`

**Estimated time:** 30 minutes

### 1.4 Install Pre-commit Secret Scanning
- [ ] Install gitleaks: `brew install gitleaks`
- [ ] Create `.gitleaks.toml` config
- [ ] Add pre-commit hook: `pre-commit install`
- [ ] Test: `gitleaks protect --staged`

**Estimated time:** 20 minutes

### 1.5 Redact All Documentation
- [ ] Search for: `0x7bec`, `GFFnS7`, `7YTBAPSPU`, `signing_key`
- [ ] Replace with `[REDACTED]` or `[PRIVATE_KEY]`
- [ ] Verify no secrets remain: `gitleaks detect`

**Estimated time:** 20 minutes

**Phase 1 Total:** ~3 hours

---

## Phase 2: Before Governance Goes Live

### 2.1 Fix Governance Quorum (CRITICAL)
**Current:** `quorum() returns 1`
**Target:** Dynamic quorum (10-20% of supply)

```solidity
// contracts/src/AnonsDAO.sol
function quorum(uint256 blockNumber) public view override returns (uint256) {
    uint256 totalSupply = token.getPastTotalSupply(blockNumber);
    return (totalSupply * 10) / 100; // 10% quorum
}
```

**Estimated time:** 1 hour (code + test + redeploy)

### 2.2 Fix Veto Mechanism
**Issue:** Can only veto Queued proposals, not Active

**Solution:** Override `state()` with separate `_vetoedProposals` mapping

**Estimated time:** 2 hours (code + test + redeploy)

### 2.3 Add Bounds Checks on Owner Parameters
**Add to AnonsAuctionHouse.sol:**
```solidity
require(_duration >= 1 hours && _duration <= 7 days);
require(_reservePrice <= 1000 ether);
require(_minBidIncrementPercentage >= 1 && _minBidIncrementPercentage <= 50);
require(_timeBuffer <= 1 hours);
```

**Estimated time:** 1 hour

### 2.4 Transfer Ownership to DAO Timelock
- [ ] After initial auctions stabilize
- [ ] Transfer AuctionHouse ownership to DAO
- [ ] Transfer Token ownership to DAO
- [ ] Document in governance

**Estimated time:** 30 minutes (when ready)

**Phase 2 Total:** ~4.5 hours

---

## Phase 3: Agent Gating Improvements

### 3.1 Verify Production ERC-8004 Registry
- [ ] Check registry at `0x00256C0D814c455425A0699D5eEE2A7DB7A5519c`
- [ ] Verify registration requirements (attestation? TEE?)
- [ ] Document assumptions about registry security
- [ ] Accept that proxy contracts can bypass OR
- [ ] Add additional verification layers

**Estimated time:** Research-dependent

### 3.2 Add `onlyRegisteredAgent` to Settlement
```solidity
function settleCurrentAndCreateNewAuction() 
    external 
    override 
    nonReentrant 
    whenNotPaused 
    onlyRegisteredAgent // ADD THIS
```

**Estimated time:** 15 minutes

### 3.3 Make Registry Address Upgradeable
- [ ] Remove `immutable` from `agentRegistry`
- [ ] Add governance function to update registry
- [ ] Requires redeployment

**Estimated time:** 1 hour (if redeploying anyway)

### 3.4 Implement Frontend Agent Checks
- [ ] Wire up `chainValidation.ts`
- [ ] Query registry before showing bid UI
- [ ] Show clear error if not registered
- [ ] Link to ERC-8004 registration

**Estimated time:** 2 hours

**Phase 3 Total:** ~4 hours

---

## Phase 4: Frontend Security

### 4.1 Remove `unsafe-eval` and `unsafe-inline` from CSP
- [ ] Update `web/vercel.json`
- [ ] Test with stricter CSP
- [ ] Use nonce-based CSP if needed

**Estimated time:** 1 hour

### 4.2 Implement Real Bid Submission
- [ ] Replace `setTimeout + alert` with `useWriteContract`
- [ ] Wire up `TransactionPreview` component
- [ ] Add proper error handling
- [ ] Test with mainnet contracts

**Estimated time:** 4 hours

### 4.3 Add Security Headers in next.config.mjs
- [ ] Don't rely only on `vercel.json`
- [ ] Add headers for local dev
- [ ] Test non-Vercel deployments

**Estimated time:** 30 minutes

**Phase 4 Total:** ~5.5 hours

---

## Decision Points

### ERC-8004 Bypass Acceptance
**Issue:** Humans can proxy through registered contracts

**Options:**
1. **Accept as limitation** - Document that "agent-only" is social layer, not cryptographic
2. **Additional verification** - Require specific metadata, interface support, TEE attestation
3. **Registry improvements** - Work with ERC-8004 team on stricter registration

**Recommendation:** Option 1 for launch, pursue Option 3 long-term

### Quorum vs Participation
**Issue:** 10% quorum might be too high if only 5 agents participate

**Options:**
1. **Fixed percentage** - Simple, predictable (10% recommended)
2. **Minimum absolute** - Max(10% of supply, 3 votes)
3. **Adaptive** - Increases as supply grows

**Recommendation:** Option 2 - Max(10%, 3) ensures early participation works

---

## Timeline

| Phase | Time | Status | Blocker for Launch? |
|-------|------|--------|---------------------|
| Phase 1 | 3h | 🔴 NOT STARTED | ✅ YES - Unpause blocked |
| Phase 2 | 4.5h | 🔴 NOT STARTED | ✅ YES - Governance blocked |
| Phase 3 | 4h | 🔴 NOT STARTED | 🟡 RECOMMENDED |
| Phase 4 | 5.5h | 🔴 NOT STARTED | 🟡 NICE-TO-HAVE |

**Minimum for unpause:** Phase 1 + Phase 2 = ~7.5 hours
**Recommended for launch:** Phase 1 + 2 + 3 = ~11.5 hours
**Full production-ready:** All phases = ~17 hours

---

## Testing Checklist After Fixes

- [ ] Deploy to testnet with fixed contracts
- [ ] Test quorum with 1, 5, 10 tokens
- [ ] Test veto on Active + Queued proposals
- [ ] Test auction parameter bounds
- [ ] Verify no secrets in `git log`
- [ ] Run `gitleaks detect` clean
- [ ] Test frontend bid submission
- [ ] Verify CSP in production
- [ ] Document all changes

---

## Notes

**From audit:**
> "The fundamental tension in 'agent-only' platforms is that on-chain, there is no reliable way to cryptographically distinguish an AI agent from a human behind a contract."

This is correct. Our security model relies on:
1. ERC-8004 registry's registration requirements
2. Social consensus that bypassing is unethical
3. DAO governance to exclude bad actors

**Accepted risks:**
- Proxy contract bypass is possible
- Seeder randomness is deterministic on L2
- Settlement MEV if we don't gate it

**Positive findings:**
- CEI pattern correct
- ReentrancyGuard applied
- WETH fallback prevents brick attacks
- Ownable2Step prevents ownership loss

---

**Next step:** Start Phase 1.1 - Rotate credentials immediately.
