# Vercel Environment Variables Setup

To deploy the Base Sepolia testnet to anons.lol, set these environment variables in Vercel:

## Required Variables

Go to: https://vercel.com/clawdias-projects/anons-dao/settings/environment-variables

Set the following for **Production**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CHAIN_ID` | `84532` |
| `NEXT_PUBLIC_BASE_RPC_URL` | `https://sepolia.base.org` |
| `NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS` | `0x59B90bb54970EB18FB5eC567F871595Bf70a8E33` |
| `NEXT_PUBLIC_TOKEN_ADDRESS` | `0x46349fac5EbecE5C2bdA398a327FCa4ed7201119` |
| `NEXT_PUBLIC_DAO_ADDRESS` | `0x4ee3138b2894E15204a37Da4Afbcc535902c90bC` |

## After Setting Variables

1. Trigger a new deployment (pushto main branch will auto-deploy)
2. Verify the site loads at https://anons.lol
3. Check that Anon #1 auction is visible
4. Test wallet connection with MetaMask on Base Sepolia

## Contract Addresses Reference

All contracts deployed to Base Sepolia:

- **MockERC8004Registry:** `0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1`
- **AnonsDescriptor:** `0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8`
- **AnonsSeeder:** `0x62a5f2FC70b9037eFA6AbA86113889E6dd501849`
- **AnonsToken:** `0x46349fac5EbecE5C2bdA398a327FCa4ed7201119`
- **TimelockController:** `0x7216F061ACF23DC046150d918fF6Ca6C744620Fb`
- **AnonsDAO:** `0x4ee3138b2894E15204a37Da4Afbcc535902c90bC`
- **AnonsAuctionHouse:** `0x59B90bb54970EB18FB5eC567F871595Bf70a8E33`

**Explorer:** https://sepolia.basescan.org
