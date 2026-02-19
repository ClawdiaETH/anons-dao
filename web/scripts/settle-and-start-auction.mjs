#!/usr/bin/env node
import { createPublicClient, createWalletClient, http } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { execSync } from 'child_process'

// Get signing key from keychain
const signingKey = execSync('~/clawd/scripts/get-secret.sh signing_key', { encoding: 'utf-8' }).trim()

if (!signingKey || !signingKey.startsWith('0x')) {
  console.error('❌ Failed to get signing key from keychain')
  process.exit(1)
}

const account = privateKeyToAccount(signingKey)

console.log(`🔑 Using account: ${account.address}`)

// Auction House contract (correct checksummed address)
const AUCTION_HOUSE = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F'

// Minimal ABI for settleCurrentAndCreateNewAuction
const auctionHouseAbi = [
  {
    name: 'settleCurrentAndCreateNewAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'auction',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'anonId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'bidder', type: 'address' },
      { name: 'settled', type: 'bool' },
      { name: 'isDusk', type: 'bool' }
    ]
  }
]

// Create clients
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
})

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http('https://mainnet.base.org')
})

async function main() {
  console.log('\n📊 Checking current auction status...')
  
  // Check current auction
  const currentAuction = await publicClient.readContract({
    address: AUCTION_HOUSE,
    abi: auctionHouseAbi,
    functionName: 'auction'
  })
  
  console.log(`\nCurrent Auction:`)
  console.log(`  Anon ID: ${currentAuction[0]}`)
  console.log(`  Amount: ${currentAuction[1]} wei`)
  console.log(`  Start Time: ${new Date(Number(currentAuction[2]) * 1000).toLocaleString()}`)
  console.log(`  End Time: ${new Date(Number(currentAuction[3]) * 1000).toLocaleString()}`)
  console.log(`  Bidder: ${currentAuction[4]}`)
  console.log(`  Settled: ${currentAuction[5]}`)
  console.log(`  Is Dusk: ${currentAuction[6]}`)
  
  // Check if auction has ended
  const now = Math.floor(Date.now() / 1000)
  const endTime = Number(currentAuction[3])
  
  if (now < endTime) {
    console.log(`\n⚠️  Auction hasn't ended yet. Ends in ${Math.floor((endTime - now) / 60)} minutes.`)
    console.log(`\nWait until ${new Date(endTime * 1000).toLocaleString()} to settle.`)
    return
  }
  
  console.log(`\n✅ Auction has ended. Settling and starting new auction...`)
  
  // Settle and start new auction
  const { request } = await publicClient.simulateContract({
    account,
    address: AUCTION_HOUSE,
    abi: auctionHouseAbi,
    functionName: 'settleCurrentAndCreateNewAuction'
  })
  
  const hash = await walletClient.writeContract(request)
  
  console.log(`\n📝 Transaction sent: ${hash}`)
  console.log(`   View on Basescan: https://basescan.org/tx/${hash}`)
  
  console.log(`\n⏳ Waiting for confirmation...`)
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  if (receipt.status === 'success') {
    console.log(`\n✅ Auction settled and new auction started!`)
    console.log(`   Block: ${receipt.blockNumber}`)
    console.log(`   Gas used: ${receipt.gasUsed}`)
    
    // Fetch new auction details
    const newAuction = await publicClient.readContract({
      address: AUCTION_HOUSE,
      abi: auctionHouseAbi,
      functionName: 'auction'
    })
    
    console.log(`\n🎉 New Auction Started:`)
    console.log(`   Anon ID: #${newAuction[0]}`)
    console.log(`   End Time: ${new Date(Number(newAuction[3]) * 1000).toLocaleString()}`)
    console.log(`   Is Dusk: ${newAuction[6]}`)
    console.log(`\n🌐 Live at: https://www.anons.lol`)
  } else {
    console.error(`\n❌ Transaction failed`)
  }
}

main().catch(console.error)
