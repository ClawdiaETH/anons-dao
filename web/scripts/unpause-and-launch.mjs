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

// Auction House contract
const AUCTION_HOUSE = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F'

// ABI with pause/unpause functions
const auctionHouseAbi = [
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
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
  // Check pause status
  console.log('\n📊 Checking contract pause status...')
  
  const isPaused = await publicClient.readContract({
    address: AUCTION_HOUSE,
    abi: auctionHouseAbi,
    functionName: 'paused'
  })
  
  console.log(`   Paused: ${isPaused}`)
  
  if (isPaused) {
    console.log('\n🔓 Unpausing auction house...')
    
    const { request } = await publicClient.simulateContract({
      account,
      address: AUCTION_HOUSE,
      abi: auctionHouseAbi,
      functionName: 'unpause'
    })
    
    const hash = await walletClient.writeContract(request)
    
    console.log(`   Transaction: ${hash}`)
    console.log(`   Basescan: https://basescan.org/tx/${hash}`)
    console.log(`\n⏳ Waiting for confirmation...`)
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status !== 'success') {
      console.error('❌ Unpause failed')
      process.exit(1)
    }
    
    console.log('✅ Auction house unpaused!')
  } else {
    console.log('✅ Auction house already unpaused')
  }
  
  // Check current auction
  console.log('\n📊 Checking current auction...')
  
  const auction = await publicClient.readContract({
    address: AUCTION_HOUSE,
    abi: auctionHouseAbi,
    functionName: 'auction'
  })
  
  console.log(`\nCurrent Auction:`)
  console.log(`   Anon ID: ${auction[0]}`)
  console.log(`   Amount: ${auction[1]} wei`)
  console.log(`   Start: ${new Date(Number(auction[2]) * 1000).toLocaleString()}`)
  console.log(`   End: ${new Date(Number(auction[3]) * 1000).toLocaleString()}`)
  console.log(`   Bidder: ${auction[4]}`)
  console.log(`   Settled: ${auction[5]}`)
  
  // Settle and create new auction
  console.log('\n🚀 Starting new auction...')
  
  const { request: settleRequest } = await publicClient.simulateContract({
    account,
    address: AUCTION_HOUSE,
    abi: auctionHouseAbi,
    functionName: 'settleCurrentAndCreateNewAuction'
  })
  
  const settleHash = await walletClient.writeContract(settleRequest)
  
  console.log(`   Transaction: ${settleHash}`)
  console.log(`   Basescan: https://basescan.org/tx/${settleHash}`)
  console.log(`\n⏳ Waiting for confirmation...`)
  
  const settleReceipt = await publicClient.waitForTransactionReceipt({ hash: settleHash })
  
  if (settleReceipt.status === 'success') {
    console.log(`\n✅ Auction settled and new auction started!`)
    console.log(`   Block: ${settleReceipt.blockNumber}`)
    console.log(`   Gas: ${settleReceipt.gasUsed}`)
    
    // Fetch new auction
    const newAuction = await publicClient.readContract({
      address: AUCTION_HOUSE,
      abi: auctionHouseAbi,
      functionName: 'auction'
    })
    
    console.log(`\n🎉 New Auction:`)
    console.log(`   Anon ID: #${newAuction[0]}`)
    console.log(`   End: ${new Date(Number(newAuction[3]) * 1000).toLocaleString()}`)
    console.log(`   Is Dusk: ${newAuction[6]}`)
    console.log(`\n🌐 Live at: https://www.anons.lol`)
  } else {
    console.error('❌ Auction start failed')
    process.exit(1)
  }
}

main().catch(console.error)
