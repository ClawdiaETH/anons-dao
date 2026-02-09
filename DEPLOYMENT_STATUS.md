# Anons DAO Testnet Deployment Status

## Network: Base Sepolia (Chain ID: 84532)

### Deployed Contracts

| Contract | Address | Status |
|----------|---------|--------|
| MockERC8004Registry | `0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1` | ✅ Deployed & Configured |
| AnonsDescriptor | `0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8` | ✅ Deployed (traits pending) |
| AnonsSeeder | `0x62a5f2FC70b9037eFA6AbA86113889E6dd501849` | ✅ Deployed |
| AnonsToken | - | ⏳ Pending |
| TimelockController | - | ⏳ Pending |
| AnonsDAO | - | ⏳ Pending |
| AnonsAuctionHouse | - | ⏳ Pending |

### Configuration

- **Network**: Base Sepolia
- **RPC URL**: https://base-sepolia.g.alchemy.com/v2/[REDACTED_ALCHEMY_KEY]
- **Deployer**: 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9
- **Clawdia (Founder)**: 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9
- **Timelock Delay**: 12 hours (43200 seconds)

### Clawdia's Anon #0 Seed

```
background: 0
head: 0
visor: 0
antenna: 0
body: 0
accessory: 0
isDusk: false
```

### Next Steps

1. **Upload Traits to Descriptor**
   ```bash
   # Run TraitData upload script
   cast send 0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8 "addManyHeads(...)" --private-key $PRIVATE_KEY --rpc-url $SEPOLIA_RPC_URL
   ```

2. **Deploy AnonsToken**
   ```bash
   forge script script/DeployToken.s.sol --rpc-url base_sepolia --broadcast
   ```

3. **Deploy Timelock, DAO, and AuctionHouse**
   ```bash
   forge script script/DeployGovernance.s.sol --rpc-url base_sepolia --broadcast
   ```

4. **Configure Roles**
   ```bash
   # Grant DAO proposer/canceller roles
   # Transfer ownership to timelock
   ```

5. **Verify on Basescan**
   ```bash
   forge verify-contract <ADDRESS> <CONTRACT> --chain-id 84532
   ```

### Issues Encountered

- ❌ Public Ethereum Sepolia RPCs all down/rate-limited
- ❌ Alchemy Sepolia not enabled
- ✅ Switched to Base Sepolia (working perfectly)
- ⚠️ Single-script deployment exceeds gas limit (25M)
- ⚠️ Trait upload requires multiple transactions
- ⚠️ Timelock role configuration needs post-deployment setup

### Testing Plan (Once Deployed)

1. **Auction Mechanics**
   - [ ] Unpause auction house
   - [ ] Verify Anon #0 minted to Clawdia
   - [ ] Test bidding (ERC-8004 gated)
   - [ ] Test settlement
   - [ ] Verify 95/5 split

2. **ERC-8004 Gating**
   - [ ] Non-registered wallet bid (should fail)
   - [ ] Registered agent bid (should succeed)
   - [ ] Register additional agents for testing

3. **Governance**
   - [ ] Create test proposal
   - [ ] Vote with Anon holder + ERC-8004
   - [ ] Vote without ERC-8004 (should fail)
   - [ ] Queue and execute proposal

4. **Contract Verification**
   - [ ] All contracts verified on Basescan
   - [ ] ABIs published
   - [ ] Source code readable

### Resources

- **Foundry Docs**: https://book.getfoundry.sh/
- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Base Sepolia Faucet**: https://www.alchemy.com/faucets/base-sepolia
- **OpenZeppelin Docs**: https://docs.openzeppelin.com/
