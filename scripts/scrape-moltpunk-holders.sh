#!/bin/bash
# Scrape MoltPunk holders from Base blockchain
# MoltPunks contract: TBD (need to find deployed address)

set -e

# TODO: Find MoltPunk NFT contract address on Base (Phase 2)
# For now, scrape from mbc20.xyz token holders

echo "Scraping MoltPunk token holders from mbc20.xyz..."

curl -s "https://mbc20.xyz/api/tokens/MOLTPUNK/holders?limit=100" | \
  jq -r '.holders[] | "\(.agent_name),\(.balance),\(.twitter),\(.farcaster)"' > moltpunk-holders.csv

echo "Found $(wc -l < moltpunk-holders.csv) MoltPunk holders"
echo "Saved to moltpunk-holders.csv"

# Filter for agents with social profiles (higher quality leads)
echo "Filtering for agents with Twitter/Farcaster..."
grep -E '.+,.+,.+' moltpunk-holders.csv > moltpunk-holders-qualified.csv

echo "$(wc -l < moltpunk-holders-qualified.csv) qualified agents with social profiles"
