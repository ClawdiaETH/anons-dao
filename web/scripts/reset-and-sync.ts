/**
 * Reset database and re-sync all data from chain
 * Run: DATABASE_URL=xxx npx tsx scripts/reset-and-sync.ts
 */
import { neon } from '@neondatabase/serverless'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const AUCTION_HOUSE = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F' as const
const DEPLOYMENT_BLOCK = 41908459n
const auctionHouseABI = [
  {
    type: 'function',
    name: 'auction',
    inputs: [],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'anonId', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'startTime', type: 'uint256' },
        { name: 'endTime', type: 'uint256' },
        { name: 'bidder', type: 'address' },
        { name: 'settled', type: 'bool' },
        { name: 'isDusk', type: 'bool' }
      ]
    }],
    stateMutability: 'view'
  }
] as const

async function resetAndSync() {
  console.log('🔄 Resetting database and syncing from chain...')
  
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) throw new Error('DATABASE_URL required')
  
  const sql = neon(DATABASE_URL)
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
  
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  })

  // 1. Clear existing data
  console.log('🗑️  Clearing existing bids...')
  await sql`DELETE FROM bids`
  console.log('✅ Cleared bids')

  // 2. Fetch current auction
  console.log('📡 Fetching current auction...')
  const auction = await client.readContract({
    address: AUCTION_HOUSE,
    abi: auctionHouseABI,
    functionName: 'auction',
  }) as any

  if (!auction || auction.startTime === 0n) {
    console.log('⚠️  Auction not started')
    return
  }

  const anonId = Number(auction.anonId)
  console.log(`✅ Found auction for Anon #${anonId}`)

  // 3. Upsert auction
  await sql`
    INSERT INTO auctions (anon_id, amount, start_time, end_time, bidder, settled, is_dusk, updated_at)
    VALUES (${anonId}, ${auction.amount.toString()}, ${auction.startTime.toString()}, ${auction.endTime.toString()}, ${auction.bidder}, ${auction.settled}, ${auction.isDusk}, NOW())
    ON CONFLICT (anon_id) 
    DO UPDATE SET 
      amount = ${auction.amount.toString()},
      bidder = ${auction.bidder},
      settled = ${auction.settled},
      updated_at = NOW()
  `

  // 4. Sync ALL historical auctions (Anon #1, #2, etc.)
  console.log('📡 Fetching ALL bid events from deployment...')
  console.log(`   From block: ${DEPLOYMENT_BLOCK}`)
  
  const logs = await client.getLogs({
    address: AUCTION_HOUSE,
    event: parseAbiItem('event AuctionBid(uint256 indexed anonId, address indexed bidder, uint256 amount, bool extended)'),
    fromBlock: DEPLOYMENT_BLOCK,
    toBlock: 'latest',
  })

  console.log(`📊 Found ${logs.length} total bid events`)

  // 5. Insert all bids
  for (const log of logs) {
    const block = await client.getBlock({ blockNumber: log.blockNumber })
    const bidAnonId = Number(log.args.anonId!)
    
    await sql`
      INSERT INTO bids (anon_id, bidder, amount, extended, block_number, timestamp, tx_hash)
      VALUES (
        ${bidAnonId},
        ${log.args.bidder!},
        ${log.args.amount!.toString()},
        ${log.args.extended!},
        ${log.blockNumber.toString()},
        ${block.timestamp.toString()},
        ${log.transactionHash}
      )
      ON CONFLICT DO NOTHING
    `
  }
  
  console.log(`✅ Inserted ${logs.length} bids`)
  
  // 6. Summary
  const anon1Count = await sql`SELECT COUNT(*) FROM bids WHERE anon_id = 1`
  const anon2Count = await sql`SELECT COUNT(*) FROM bids WHERE anon_id = 2`
  
  console.log(`\n✨ Summary:`)
  console.log(`   Anon #1: ${anon1Count[0].count} bids`)
  console.log(`   Anon #2: ${anon2Count[0].count} bids`)
}

resetAndSync()
  .then(() => {
    console.log('✅ Reset and sync complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
