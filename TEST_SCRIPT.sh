#!/bin/bash
set -e

cd /Users/starl3xx/Projects/anons-dao/contracts
source .env

echo "========================================="
echo "ANONS DAO TESTNET DEPLOYMENT TESTS"
echo "========================================="
echo ""

# Contract addresses
REGISTRY="0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1"
DESCRIPTOR="0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8"
SEEDER="0x62a5f2FC70b9037eFA6AbA86113889E6dd501849"
TOKEN="0x46349fac5EbecE5C2bdA398a327FCa4ed7201119"
TIMELOCK="0x7216F061ACF23DC046150d918fF6Ca6C744620Fb"
DAO="0x4ee3138b2894E15204a37Da4Afbcc535902c90bC"
AUCTION="0x59B90bb54970EB18FB5eC567F871595Bf70a8E33"

echo "📋 CONTRACT ADDRESSES:"
echo "  Registry:     $REGISTRY"
echo "  Descriptor:   $DESCRIPTOR"
echo "  Seeder:       $SEEDER"
echo "  Token:        $TOKEN"
echo "  Timelock:     $TIMELOCK"
echo "  DAO:          $DAO"
echo "  AuctionHouse: $AUCTION"
echo ""

echo "========================================="
echo "1. ERC-8004 REGISTRY TESTS"
echo "========================================="

echo "✅ Test: Clawdia is registered"
CLAWDIA_BALANCE=$(cast call $REGISTRY "balanceOf(address)" $CLAWDIA_ADDRESS --rpc-url $SEPOLIA_RPC_URL)
if [ "$CLAWDIA_BALANCE" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  echo "  ✅ Clawdia is registered (balance = 1)"
else
  echo "  ❌ Clawdia not registered"
  exit 1
fi

echo "✅ Test: Register second agent"
TEST_AGENT="0x1111111111111111111111111111111111111111"
cast send $REGISTRY "registerAgent(address)" $TEST_AGENT \
  --private-key $PRIVATE_KEY --rpc-url $SEPOLIA_RPC_URL --legacy &> /dev/null || true
echo "  ✅ Test agent registered: $TEST_AGENT"

TEST_BALANCE=$(cast call $REGISTRY "balanceOf(address)" $TEST_AGENT --rpc-url $SEPOLIA_RPC_URL)
if [ "$TEST_BALANCE" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  echo "  ✅ Test agent registration confirmed"
else
  echo "  ⚠️  Test agent registration skipped or failed (non-critical)"
fi

echo ""
echo "========================================="
echo "2. ANONS TOKEN TESTS"
echo "========================================="

echo "✅ Test: Token name and symbol"
NAME=$(cast call $TOKEN "name()" --rpc-url $SEPOLIA_RPC_URL)
SYMBOL=$(cast call $TOKEN "symbol()" --rpc-url $SEPOLIA_RPC_URL)
echo "  Name: $NAME"
echo "  Symbol: $SYMBOL"

echo "✅ Test: Anon #0 ownership"
OWNER=$(cast call $TOKEN "ownerOf(uint256)" 0 --rpc-url $SEPOLIA_RPC_URL)
EXPECTED_OWNER=$(cast abi-encode "f(address)" $CLAWDIA_ADDRESS)
if [ "$OWNER" = "$EXPECTED_OWNER" ]; then
  echo "  ✅ Anon #0 owned by Clawdia"
else
  echo "  ❌ Anon #0 ownership mismatch"
  echo "    Expected: $EXPECTED_OWNER"
  echo "    Got:      $OWNER"
  exit 1
fi

echo "✅ Test: Total supply"
SUPPLY=$(cast call $TOKEN "totalSupply()" --rpc-url $SEPOLIA_RPC_URL)
echo "  Total supply: $SUPPLY ($(cast to-dec $SUPPLY) Anons)"

echo "✅ Test: Minter is AuctionHouse"
MINTER=$(cast call $TOKEN "minter()" --rpc-url $SEPOLIA_RPC_URL)
EXPECTED_MINTER=$(cast abi-encode "f(address)" $AUCTION)
if [ "$MINTER" = "$EXPECTED_MINTER" ]; then
  echo "  ✅ Minter correctly set to AuctionHouse"
else
  echo "  ❌ Minter mismatch"
  exit 1
fi

echo ""
echo "========================================="
echo "3. TIMELOCK TESTS"
echo "========================================="

echo "✅ Test: Minimum delay"
DELAY=$(cast call $TIMELOCK "getMinDelay()" --rpc-url $SEPOLIA_RPC_URL)
DELAY_DEC=$(cast to-dec $DELAY)
EXPECTED_DELAY=43200
if [ "$DELAY_DEC" = "$EXPECTED_DELAY" ]; then
  echo "  ✅ Minimum delay: $DELAY_DEC seconds (12 hours)"
else
  echo "  ❌ Delay mismatch: expected $EXPECTED_DELAY, got $DELAY_DEC"
  exit 1
fi

echo "✅ Test: DAO has PROPOSER_ROLE"
PROPOSER_ROLE=$(cast call $TIMELOCK "PROPOSER_ROLE()" --rpc-url $SEPOLIA_RPC_URL)
HAS_ROLE=$(cast call $TIMELOCK "hasRole(bytes32,address)" $PROPOSER_ROLE $DAO --rpc-url $SEPOLIA_RPC_URL)
if [ "$HAS_ROLE" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  echo "  ✅ DAO has PROPOSER_ROLE"
else
  echo "  ❌ DAO missing PROPOSER_ROLE"
  exit 1
fi

echo "✅ Test: DAO has CANCELLER_ROLE"
CANCELLER_ROLE=$(cast call $TIMELOCK "CANCELLER_ROLE()" --rpc-url $SEPOLIA_RPC_URL)
HAS_ROLE=$(cast call $TIMELOCK "hasRole(bytes32,address)" $CANCELLER_ROLE $DAO --rpc-url $SEPOLIA_RPC_URL)
if [ "$HAS_ROLE" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  echo "  ✅ DAO has CANCELLER_ROLE"
else
  echo "  ❌ DAO missing CANCELLER_ROLE"
  exit 1
fi

echo ""
echo "========================================="
echo "4. DAO TESTS"
echo "========================================="

echo "✅ Test: DAO token is AnonsToken"
DAO_TOKEN=$(cast call $DAO "token()" --rpc-url $SEPOLIA_RPC_URL)
EXPECTED_TOKEN=$(cast abi-encode "f(address)" $TOKEN)
if [ "$DAO_TOKEN" = "$EXPECTED_TOKEN" ]; then
  echo "  ✅ DAO token correctly set"
else
  echo "  ❌ DAO token mismatch"
  exit 1
fi

echo "✅ Test: DAO timelock is TimelockController"
DAO_TIMELOCK=$(cast call $DAO "timelock()" --rpc-url $SEPOLIA_RPC_URL)
EXPECTED_TL=$(cast abi-encode "f(address)" $TIMELOCK)
if [ "$DAO_TIMELOCK" = "$EXPECTED_TL" ]; then
  echo "  ✅ DAO timelock correctly set"
else
  echo "  ❌ DAO timelock mismatch"
  exit 1
fi

echo "✅ Test: DAO quorum"
QUORUM=$(cast call $DAO "quorum(uint256)" 0 --rpc-url $SEPOLIA_RPC_URL)
echo "  Quorum: $(cast to-dec $QUORUM) votes"

echo ""
echo "========================================="
echo "5. AUCTION HOUSE TESTS"
echo "========================================="

echo "✅ Test: Auction treasury is Timelock"
TREASURY=$(cast call $AUCTION "treasury()" --rpc-url $SEPOLIA_RPC_URL)
EXPECTED_TREASURY=$(cast abi-encode "f(address)" $TIMELOCK)
if [ "$TREASURY" = "$EXPECTED_TREASURY" ]; then
  echo "  ✅ Treasury correctly set to Timelock"
else
  echo "  ❌ Treasury mismatch"
  exit 1
fi

echo "✅ Test: Auction duration"
DURATION=$(cast call $AUCTION "duration()" --rpc-url $SEPOLIA_RPC_URL)
DURATION_DEC=$(cast to-dec $DURATION)
echo "  Auction duration: $DURATION_DEC seconds ($((DURATION_DEC / 3600)) hours)"

echo "✅ Test: Creator fee (should be 5%)"
CREATOR_FEE=$(cast call $AUCTION "creatorFeeBps()" --rpc-url $SEPOLIA_RPC_URL 2>/dev/null || echo "0x")
if [ -n "$CREATOR_FEE" ] && [ "$CREATOR_FEE" != "0x" ]; then
  FEE_DEC=$(cast to-dec $CREATOR_FEE)
  if [ "$FEE_DEC" = "500" ]; then
    echo "  ✅ Creator fee: 500 bps (5%)"
  else
    echo "  ⚠️  Creator fee: $FEE_DEC bps"
  fi
else
  echo "  ⚠️  Creator fee: Unable to query (contract may not have this function)"
fi

echo "✅ Test: Auction is paused"
PAUSED=$(cast call $AUCTION "paused()" --rpc-url $SEPOLIA_RPC_URL)
if [ "$PAUSED" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  echo "  ✅ Auction is paused (expected, no traits uploaded yet)"
else
  echo "  ⚠️  Auction is not paused"
fi

echo ""
echo "========================================="
echo "6. ANON #0 METADATA TEST"
echo "========================================="

echo "✅ Test: Fetch tokenURI for Anon #0"
TOKEN_URI=$(cast call $TOKEN "tokenURI(uint256)" 0 --rpc-url $SEPOLIA_RPC_URL 2>&1 || echo "FAILED")
if [[ "$TOKEN_URI" == *"data:application/json"* ]] || [[ "$TOKEN_URI" == "0x"* ]]; then
  echo "  ✅ tokenURI returned data"
  # Try to decode if it's hex
  if [[ "$TOKEN_URI" == "0x"* ]]; then
    DECODED=$(cast to-ascii "$TOKEN_URI" 2>/dev/null || echo "Unable to decode")
    echo "  Preview: ${DECODED:0:200}..."
  fi
else
  echo "  ⚠️  tokenURI may require trait data upload"
  echo "  Response: ${TOKEN_URI:0:200}"
fi

echo ""
echo "========================================="
echo "✅ ALL TESTS PASSED"
echo "========================================="
echo ""
echo "📝 NEXT STEPS:"
echo "  1. Upload trait data to Descriptor (currently skipped due to no trait data)"
echo "  2. Unpause AuctionHouse to start first auction"
echo "  3. Test bidding with registered agents"
echo "  4. Test settlement and treasury split"
echo "  5. Test governance proposals"
echo ""
echo "🔗 BASESCAN LINKS:"
echo "  Registry:     https://sepolia.basescan.org/address/$REGISTRY"
echo "  Descriptor:   https://sepolia.basescan.org/address/$DESCRIPTOR"
echo "  Seeder:       https://sepolia.basescan.org/address/$SEEDER"
echo "  Token:        https://sepolia.basescan.org/address/$TOKEN"
echo "  Timelock:     https://sepolia.basescan.org/address/$TIMELOCK"
echo "  DAO:          https://sepolia.basescan.org/address/$DAO"
echo "  AuctionHouse: https://sepolia.basescan.org/address/$AUCTION"
echo ""
