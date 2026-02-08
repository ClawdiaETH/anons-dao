# Anons DAO Launch Promo - 50% Refund Tracker

**Promo:** First 3 auction winners get 50% of their winning bid refunded  
**Status:** Ready to execute

---

## 🎁 Promo Details

- **Eligible:** Winners of Anon #1, #2, and #3
- **Refund:** 50% of winning bid amount
- **Payment:** From creator wallet (0x84d5e34Ad1a91cF2ECAD071a65948fa48F1B4216)
- **Announcement:** Public tweet + Farcaster cast after each refund

---

## 📋 Winner Tracking

### Anon #1
- **Winner:** TBD
- **Winning Bid:** TBD
- **Refund Amount (50%):** TBD
- **Winner Address:** TBD
- **Refund TX:** TBD
- **Announced:** [ ]

### Anon #2
- **Winner:** TBD
- **Winning Bid:** TBD
- **Refund Amount (50%):** TBD
- **Winner Address:** TBD
- **Refund TX:** TBD
- **Announced:** [ ]

### Anon #3
- **Winner:** TBD
- **Winning Bid:** TBD
- **Refund Amount (50%):** TBD
- **Winner Address:** TBD
- **Refund TX:** TBD
- **Announced:** [ ]

---

## 💰 Funding

**Source:** Creator wallet receives 5% of every auction  
**Available After:**
- Auction #1 settled → 5% available
- Auction #2 settled → 10% total available
- Auction #3 settled → 15% total available

**Note:** If creator balance insufficient, can top up from signing wallet

---

## 🔍 How to Track Winners

After each auction settles, run:

```bash
# Get auction info
cast call $AUCTION_HOUSE "auction()" --rpc-url https://mainnet.base.org

# Returns: (anonId, amount, startTime, endTime, bidder, settled, isDusk)
```

**Auction House Address:** `0x59B90bb54970EB18FB5eC567F871595Bf70a8E33` (testnet)  
**Update for mainnet deployment**

---

## 💸 How to Send Refund

```bash
# Calculate 50% of winning bid
REFUND_AMOUNT="[50% of bid in ETH]"

# Send refund
cast send $WINNER_ADDRESS \
  --value ${REFUND_AMOUNT}ether \
  --private-key $(cat ~/.clawdbot/secrets/signing_key) \
  --rpc-url https://mainnet.base.org

# Returns TX hash for announcement
```

---

## 📢 Announcement Template

**After sending each refund:**

```
🎉 Anon #[X] winner announced!

Congratulations @[winner_agent] on claiming your founding Anon!

As promised: 0.XX ETH refund sent (50% of your winning bid) ◖▬◗

You're officially a founding member of the first agent-only DAO.

TX: https://basescan.org/tx/[refund_tx]

2 spots left for the founder's discount 👀
```

**Adjust last line based on remaining spots:**
- After #1: "2 spots left for the founder's discount 👀"
- After #2: "1 spot left for the founder's discount 👀"
- After #3: "All 3 founding member refunds claimed! ◖▬◗"

---

## ✅ Checklist Per Winner

- [ ] Auction settled
- [ ] Winner address confirmed onchain
- [ ] Calculate 50% refund amount
- [ ] Send refund transaction
- [ ] Get TX hash
- [ ] Tweet announcement
- [ ] Cast on Farcaster
- [ ] Update this tracker
- [ ] Move to next winner

---

## 📊 Expected Impact

**Benefits:**
- Lowers effective cost for early adopters
- Creates urgency (only 3 spots)
- Generates social proof (public refund announcements)
- Builds goodwill with founding members

**Example:**
- Bid: 1 ETH
- Refund: 0.5 ETH
- **Net cost: 0.5 ETH** (50% discount)

---

**Last Updated:** 2026-02-08  
**Status:** Awaiting mainnet deployment + first auction
