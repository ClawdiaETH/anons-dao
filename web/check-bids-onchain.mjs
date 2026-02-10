import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const AUCTION_HOUSE = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F'
const DEPLOYMENT_BLOCK = 41908459n

async function checkBids() {
  try {
    // Try Alchemy first, fall back to public RPC
    const alchemyKey = 'MNuDEFFEymzF6IuMa1r1oDgkqb4mBLqE' // Full key from Vercel logs
    const rpcUrl = `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
    console.log('Using Alchemy RPC')
    
    const client = createPublicClient({
      chain: base,
      transport: http(rpcUrl, { timeout: 30000 }),
    })

    const currentBlock = await client.getBlockNumber()
    console.log('Current block:', currentBlock.toString())
    console.log('Deployment block:', DEPLOYMENT_BLOCK.toString())
    console.log('Blocks to scan:', (currentBlock - DEPLOYMENT_BLOCK).toString())

    // Scan in chunks to avoid rate limits
    const CHUNK_SIZE = 10000n
    let allLogs = []
    
    console.log('\nFetching AuctionBid events in chunks...')
    for (let from = DEPLOYMENT_BLOCK; from <= currentBlock; from += CHUNK_SIZE) {
      const to = from + CHUNK_SIZE - 1n > currentBlock ? currentBlock : from + CHUNK_SIZE - 1n
      console.log(`  Scanning blocks ${from} - ${to}...`)
      
      const logs = await client.getLogs({
        address: AUCTION_HOUSE,
        event: parseAbiItem('event AuctionBid(uint256 indexed anonId, address indexed bidder, uint256 amount, bool extended)'),
        fromBlock: from,
        toBlock: to,
      })
      
      allLogs.push(...logs)
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    const logs = allLogs

    console.log(`\n✅ Found ${logs.length} total bid events`)

    if (logs.length > 0) {
      console.log('\nBid breakdown by Anon:')
      const bidsByAnon = {}
      for (const log of logs) {
        const anonId = log.args.anonId.toString()
        if (!bidsByAnon[anonId]) bidsByAnon[anonId] = []
        bidsByAnon[anonId].push({
          bidder: log.args.bidder,
          amount: log.args.amount.toString(),
          extended: log.args.extended,
          block: log.blockNumber.toString(),
        })
      }

      for (const [anonId, bids] of Object.entries(bidsByAnon)) {
        console.log(`\nAnon #${anonId}: ${bids.length} bids`)
        bids.forEach((bid, i) => {
          const eth = (Number(bid.amount) / 1e18).toFixed(4)
          console.log(`  ${i + 1}. ${bid.bidder.slice(0, 8)}... - ${eth} ETH (block ${bid.block})`)
        })
      }

      // Calculate treasury (sum of winning bids)
      let treasuryWei = 0n
      const uniqueWinners = new Set()
      for (const [anonId, bids] of Object.entries(bidsByAnon)) {
        const winningBid = bids[bids.length - 1] // Last bid wins
        treasuryWei += BigInt(winningBid.amount)
        uniqueWinners.add(winningBid.bidder.toLowerCase())
      }

      const treasuryEth = (Number(treasuryWei) / 1e18).toFixed(4)
      console.log(`\n📊 Stats:`)
      console.log(`   Treasury: ${treasuryEth} ETH`)
      console.log(`   Unique winners: ${uniqueWinners.size}`)
    } else {
      console.log('\n⚠️  No bids found on-chain!')
      console.log('This could mean:')
      console.log('  1. No bids have been placed yet')
      console.log('  2. Wrong contract address')
      console.log('  3. Wrong event signature')
      console.log('  4. RPC rate limiting')
    }
  } catch (error) {
    console.error('Error:', error.message)
    if (error.details) console.error('Details:', error.details)
  }
}

checkBids()
