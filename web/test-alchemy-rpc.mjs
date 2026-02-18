import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const client = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/MNuDEFFEymzF6IuMa1r1o'),
})

console.log('Testing Alchemy RPC...')
console.log('Querying ProposalCreated events from block 42290000')

try {
  const logs = await client.getLogs({
    address: GOVERNOR_ADDRESS,
    event: parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
    fromBlock: BigInt(42290000),
    toBlock: 'latest',
  })

  console.log(`\n✅ Success! Found ${logs.length} proposals`)
  
  if (logs.length > 0) {
    console.log('\nFirst proposal:')
    console.log('- ID:', logs[0].args.proposalId?.toString())
    console.log('- Proposer:', logs[0].args.proposer)
    console.log('- Block:', logs[0].blockNumber)
  }
} catch (error) {
  console.error('❌ Error:', error.message)
  if (error.details) console.error('Details:', error.details)
}
