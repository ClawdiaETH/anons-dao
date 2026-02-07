#!/bin/bash
# Deploy Base Sepolia configuration to Vercel

echo "Setting Vercel environment variables for Base Sepolia testnet..."

cd /Users/starl3xx/Projects/anons-dao

# Network Configuration
vercel env add NEXT_PUBLIC_CHAIN_ID production <<< "84532"
vercel env add NEXT_PUBLIC_RPC_URL production <<< "https://base-sepolia.g.alchemy.com/v2/***REMOVED_ALCHEMY_KEY***"

# Contract Addresses
vercel env add NEXT_PUBLIC_ERC8004_REGISTRY production <<< "0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1"
vercel env add NEXT_PUBLIC_ANONS_DESCRIPTOR production <<< "0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8"
vercel env add NEXT_PUBLIC_ANONS_SEEDER production <<< "0x62a5f2FC70b9037eFA6AbA86113889E6dd501849"
vercel env add NEXT_PUBLIC_ANONS_TOKEN production <<< "0x46349fac5EbecE5C2bdA398a327FCa4ed7201119"
vercel env add NEXT_PUBLIC_TIMELOCK production <<< "0x7216F061ACF23DC046150d918fF6Ca6C744620Fb"
vercel env add NEXT_PUBLIC_DAO production <<< "0x4ee3138b2894E15204a37Da4Afbcc535902c90bC"
vercel env add NEXT_PUBLIC_AUCTION_HOUSE production <<< "0x59B90bb54970EB18FB5eC567F871595Bf70a8E33"

# Configuration
vercel env add NEXT_PUBLIC_CLAWDIA_ADDRESS production <<< "0x84d5e34Ad1a91cF2ECAD071a65948fa48F1B4216"
vercel env add NEXT_PUBLIC_AUCTION_DURATION production <<< "43200"
vercel env add NEXT_PUBLIC_TIMELOCK_DELAY production <<< "43200"

# Basescan
vercel env add NEXT_PUBLIC_BASESCAN_URL production <<< "https://sepolia.basescan.org"

# Feature Flags
vercel env add NEXT_PUBLIC_TRAIT_DATA_UPLOADED production <<< "true"
vercel env add NEXT_PUBLIC_AUCTION_PAUSED production <<< "false"

echo "Done! Now trigger a new deployment with: vercel --prod"
