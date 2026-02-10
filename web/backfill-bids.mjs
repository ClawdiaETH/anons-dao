#!/usr/bin/env node
/**
 * Backfill historical bid data into production database
 * Manually inserts known winning bids from Basescan
 */
import { neon } from '@neondatabase/serverless'

// Get DATABASE_URL from Vercel env or .env.local
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL required')
  console.error('Get it from: vercel env pull')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

console.log('📝 Backfilling historical bid data...\n')

try {
  // Anon #1 winning bid: axiombotx.base.eth (0x523eff3db03938eaa31a5a6fbd41e3b9d23edde5)
  // Amount: 0.166 ETH = 166000000000000000 wei
  // Block: 41931227
  // Timestamp: 1770651801
  console.log('Inserting Anon #1 winning bid...')
  await sql`
    INSERT INTO bids (anon_id, bidder, amount, extended, timestamp, block_number, tx_hash)
    VALUES (
      1,
      '0x523eff3db03938eaa31a5a6fbd41e3b9d23edde5',
      '166000000000000000',
      false,
      1770651801,
      41931227,
      '0xc896292d44de95faed44d85730db5246da6489b679dd45b91c6144833cdef255'
    )
    ON CONFLICT DO NOTHING
  `
  console.log('✅ Anon #1 bid inserted')

  // Anon #2 winning bid: 0xF637d959eE3361F18A176F87EcFc1E9BC651fbc0  
  // Amount: 0.1743 ETH = 174300000000000000 wei
  // Block: 41951553
  // Timestamp: 1770692453
  console.log('Inserting Anon #2 winning bid...')
  await sql`
    INSERT INTO bids (anon_id, bidder, amount, extended, timestamp, block_number, tx_hash)
    VALUES (
      2,
      '0xF637d959eE3361F18A176F87EcFc1E9BC651fbc0',
      '174300000000000000',
      false,
      1770692453,
      41951553,
      '0x73842f26398b60878fab9dcb09dfaff7ecd7ceb508f823527039d9790fc0b3b8'
    )
    ON CONFLICT DO NOTHING
  `
  console.log('✅ Anon #2 bid inserted')

  // Verify
  console.log('\n📊 Verifying database...')
  const result = await sql`
    SELECT anon_id, bidder, amount 
    FROM bids 
    ORDER BY anon_id
  `
  
  console.log(`Found ${result.length} bids:`)
  for (const bid of result) {
    const eth = (Number(bid.amount) / 1e18).toFixed(4)
    console.log(`  Anon #${bid.anon_id}: ${bid.bidder.slice(0, 10)}... - ${eth} ETH`)
  }

  // Calculate expected stats
  const totalWei = result.reduce((sum, bid) => sum + BigInt(bid.amount), 0n)
  const totalEth = (Number(totalWei) / 1e18).toFixed(4)
  const uniqueBidders = new Set(result.map(b => b.bidder.toLowerCase())).size

  console.log(`\n📈 Expected stats:`)
  console.log(`   Treasury: ${totalEth} ETH`)
  console.log(`   Unique holders: ${uniqueBidders}`)

  console.log('\n✅ Backfill complete!')
  console.log('Test at: https://www.anons.lol/api/stats')
} catch (error) {
  console.error('❌ Backfill failed:', error.message)
  if (error.code) console.error('Error code:', error.code)
  process.exit(1)
}
