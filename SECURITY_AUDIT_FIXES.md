# Security Audit Remediation Plan

**Audit Date:** February 7, 2026  
**Overall Risk:** HIGH (NOT READY for mainnet)  
**Status:** In Progress

---

## ✅ FIXED ISSUES

### C-1: Exposed API Keys and Private Keys (CRITICAL)
**Status:** ✅ PARTIALLY FIXED

**Actions Taken:**
1. Removed `.env.production`, `.env.production.check`, `contracts/.env.sepolia` from git
2. Deleted `deploy-sepolia-to-vercel.sh`, `upload-traits.js`, `upload-traits-fixed.js`
3. Updated `.gitignore` to block all `.env.*` files

**Exposed Credentials:**
- Private key: `0x7bec...1891` → `0x84d5...4216` (testnet only, 0.036 ETH)
- Alchemy API: `***REMOVED_ALCHEMY_KEY***`
- Etherscan API: `***REMOVED_BASESCAN_KEY***`

**Remaining Actions:**
- [ ] Rotate Alchemy API key
- [ ] Rotate Etherscan API key  
- [ ] Generate new signing key for mainnet deployment
- [ ] (Optional) Purge git history with `git filter-repo`

---

## 🚨 CRITICAL - MUST FIX BEFORE MAINNET

### C-2: Weak Randomness in AnonsSeeder (CRITICAL)
**File:** `contracts/src/AnonsSeeder.sol:17`  
**Risk:** Trait manipulation by sequencer/settlers

**Current Implementation:**
```solidity
uint256 pseudorandomness = uint256(
    keccak256(abi.encodePacked(blockhash(block.number - 1), anonId))
);
```

**Problem:**
- `blockhash` is predictable to anyone in the same block
- `anonId` is a known counter
- Base sequencer has control over block ordering
- Settlers can predict exact traits and selectively settle

**Impact:**
- Destroys trait rarity guarantees
- Undermines entire NFT collection fairness
- Attackers can target rare trait combinations

**Recommended Fix (Gold Standard):**
Implement Chainlink VRF v2.5 for verifiable randomness:
```solidity
// Pseudo-code - requires VRF integration
function settleAuction() external {
    // ... settle current auction ...
    
    // Request randomness for next Anon
    vrfRequestId = requestRandomWords(callbackGasLimit, requestConfirmations, numWords);
    emit RandomnessRequested(nextAnonId, vrfRequestId);
}

function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    // Use randomWords[0] to generate seed for next Anon
    // Mint with verifiable random seed
}
```

**Alternative Fix (Simpler, Lower Security):**
Add unpredictable inputs to increase manipulation cost:
```solidity
uint256 pseudorandomness = uint256(
    keccak256(abi.encodePacked(
        blockhash(block.number - 1),
        anonId,
        msg.sender,
        block.prevrandao,
        previousAuction.bidder,
        previousAuction.amount
    ))
);
```

**Decision Required:** Choose VRF (best security) or enhanced pseudo-randomness (simpler)

---

## ⚠️ HIGH SEVERITY - SHOULD FIX

### H-1: Risky Interaction Order in Auction Settlement
**File:** `contracts/src/AnonsAuctionHouse.sol:204-217`  
**Risk:** CEI violation, potential bricking on treasury/creator revert

**Current Order:**
1. Set `_auction.settled = true`
2. Transfer NFT to bidder (triggers `onERC721Received`)
3. Transfer ETH to treasury
4. Transfer ETH to creator

**Problem:**
- If treasury/creator is a contract that reverts on ETH receipt, settlement bricks
- Violates checks-effects-interactions pattern
- Unnecessary risk surface

**Fix:**
```solidity
function _settleAuction() internal {
    // ... checks ...
    
    // 1. Effects FIRST
    _auction.settled = true;
    
    // 2. ETH transfers BEFORE NFT
    if (currentAuction.amount > 0) {
        _safeTransferETH(treasury, treasuryAmount);
        _safeTransferETH(creator, creatorAmount);
    }
    
    // 3. NFT transfer LAST
    anons.transferFrom(address(this), currentAuction.bidder, currentAuction.anonId);
}
```

**Additional Safety:**
- Consider adding rescue function for failed settlements
- Document treasury/creator address requirements (must accept ETH)

### H-2: Descriptor/Seeder Not Locked Before Production
**Files:** `AnonsToken.sol`, `Deploy.s.sol`  
**Risk:** Trait data could be modified after deployment

**Status:** ⚠️ Contracts support locking, but not called in deploy scripts

**Fix:**
```solidity
// After trait data upload is complete:
descriptor.lockParts();
token.setDescriptorLocked();
token.setSeederLocked();
```

**TODO:**
- [ ] Add locking step to deployment scripts
- [ ] Document in README that locking is permanent
- [ ] Add pre-launch checklist

### H-3: Veto Power Not Burned in Production Docs
**File:** `AnonsDAO.sol:164`  
**Risk:** Permanent centralization if veto not burned

**Current:** Veto power exists with `burnVetoPower()` function  
**Issue:** No documentation on WHEN to burn it  
**Impact:** Looks centralized if never burned

**Fix:**
- [ ] Document veto burn timeline (e.g., "30 days after launch")
- [ ] Create governance proposal template for veto burn
- [ ] Add to post-launch checklist

### H-4: Missing Pause Mechanism in DAO/Timelock
**Risk:** No emergency stop if governance exploit found

**Current:** AuctionHouse has pause, DAO/Timelock do not  
**Impact:** Cannot freeze governance during incident response

**Recommendation:**
- Consider adding pause to critical DAO functions
- Document incident response procedures
- Low priority if Timelock is behind multisig

### H-5: No Slippage Protection on Bid Amounts
**File:** `AnonsAuctionHouse.sol:154`  
**Risk:** Front-running can force higher bids than expected

**Current:** Bidders send exact ETH amount  
**Issue:** If front-run, must pay 5% more than expected

**Fix (optional):**
```solidity
function createBid(uint256 anonId, uint256 maxAmount) external payable {
    require(msg.value <= maxAmount, "Bid exceeds max");
    // ... rest of logic ...
}
```

**Priority:** LOW (standard auction behavior)

---

## 🟡 MEDIUM SEVERITY - RECOMMENDED

### M-1: Treasury Can Accumulate Dust from Rounding
**Impact:** Small amounts of ETH lost over time

**Fix:** Track and allow withdrawal of accumulated dust

### M-2: No Events for Config Changes
**Files:** Various setters  
**Impact:** Hard to audit ownership/config changes

**Fix:** Add events to all admin functions

### M-3: Block Gas Limit Risk in Descriptor
**File:** `AnonsDescriptor.sol`  
**Risk:** Complex Anons might exceed block gas limit

**Mitigation:** Already in place (scan-line RLE compression)  
**Monitor:** Test worst-case trait combinations

### M-4: Integer Overflow in Old Solidity (Not Applicable)
**Status:** ✅ Using 0.8.24 with built-in overflow checks

### M-5: Insufficient Input Validation
**Various:** Some functions lack zero-address checks

**Fix:** Add `require(addr != address(0))` to setters

---

## ℹ️ LOW / INFORMATIONAL

### I-1: Hardcoded Gas Limits
**Impact:** May fail on future network upgrades

**Fix:** Make gas limits configurable

### I-2: Missing NatSpec Documentation
**Impact:** Harder for auditors/integrators

**Fix:** Add comprehensive NatSpec comments

### I-3: Inconsistent Error Messages
**Impact:** User experience

**Fix:** Standardize custom errors

### I-4: Magic Numbers
**Example:** `5% = 105/100` in bid calculation

**Fix:** Use named constants

### I-5: No Circuit Breaker Pattern
**Impact:** Limited incident response options

**Fix:** Consider adding emergency withdrawal

### I-6: Test Coverage Gaps
**Current:** 82 tests  
**Recommendation:** Add fuzzing tests for edge cases

---

## 📋 PRE-MAINNET CHECKLIST

### Critical (Must Do)
- [ ] Fix C-2: Implement VRF or enhanced randomness
- [ ] Rotate all exposed API keys
- [ ] Generate new mainnet signing key
- [ ] Fix H-1: Reorder settlement interactions
- [ ] Lock descriptor/seeder after trait upload
- [ ] Document veto burn timeline

### High Priority (Should Do)
- [ ] Add settlement rescue function
- [ ] Add config change events
- [ ] Comprehensive input validation
- [ ] Full security audit by professional firm

### Recommended (Nice to Have)
- [ ] Purge git history of secrets
- [ ] Add pre-commit hooks for secret scanning
- [ ] Improve test coverage to 95%+
- [ ] Add fuzzing tests
- [ ] Deploy to mainnet testnet first

---

## 🎯 DEPLOYMENT READINESS

**Current Status:** 🔴 NOT READY

**Blockers:**
1. C-2: Weak randomness (CRITICAL)
2. Exposed API credentials (CRITICAL - partially fixed)
3. H-1: Settlement interaction order (HIGH)

**Estimated Time to Mainnet Ready:** 2-3 days
- 1 day: Implement VRF or enhanced randomness
- 0.5 day: Fix settlement order + add safety features
- 0.5 day: Rotate credentials + final security review
- 1 day: Testing + documentation

**Post-Fix Actions:**
1. Full regression testing on Sepolia
2. Professional audit firm review (optional but recommended)
3. Deploy to Base mainnet testnet (if available)
4. Community security review period
5. Mainnet deployment

---

**Report Generated:** 2026-02-07  
**Next Review:** After critical fixes implemented
