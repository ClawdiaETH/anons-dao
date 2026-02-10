/**
 * Manual sync script - populate database with current auction data
 * Run: DATABASE_URL=xxx npx tsx scripts/sync-db.ts
 */
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'
import { neon } from '@neondatabase/serverless'

const AUCTION_HOUSE = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F' as const
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

async function sync() {
  console.log('🔄 Syncing database...')
  
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) throw new Error('DATABASE_URL required')
  
  const sql = neon(DATABASE_URL)
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
  
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  })

  // 1. Fetch current auction
  console.log('📡 Fetching auction from chain...')
  const auction = await client.readContract({
    address: AUCTION_HOUSE,
    abi: auctionHouseABI,
    functionName: 'auction',
  }) as any

  if (!auction || auction.startTime === 0n) {
    console.log('⚠️  Auction not started yet')
    return
  }

  const anonId = Number(auction.anonId)
  console.log(`✅ Found auction for Anon #${anonId}`)

  // 2. Upsert auction
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
  console.log(`✅ Upserted auction #${anonId}`)

  // 3. Fetch bid events
  console.log('📡 Fetching bids from chain...')
  const currentBlock = await client.getBlockNumber()
  const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n

  const logs = await client.getLogs({
    address: AUCTION_HOUSE,
    event: parseAbiItem('event AuctionBid(uint256 indexed anonId, address indexed bidder, uint256 amount, bool extended)'),
    args: { anonId: BigInt(anonId) },
    fromBlock,
    toBlock: 'latest',
  })

  console.log(`📊 Found ${logs.length} bid events`)

  // 4. Insert bids
  for (const log of logs) {
    const block = await client.getBlock({ blockNumber: log.blockNumber })
    
    await sql`
      INSERT INTO bids (anon_id, bidder, amount, extended, block_number, timestamp, tx_hash)
      VALUES (
        ${anonId},
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
  
  // 5. Verify
  const totalBids = await sql`SELECT COUNT(*) FROM bids WHERE anon_id = ${anonId}`
  console.log(`✨ Total bids in DB for Anon #${anonId}: ${totalBids[0].count}`)
}

sync()
  .then(() => {
    console.log('✅ Sync complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  })
