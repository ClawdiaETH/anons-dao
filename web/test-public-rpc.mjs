import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

// Try with a very narrow range around the known proposal block (42319886)
const client = createPublicClient({
  chain: base,
  transport: http('https://base.llamarpc.com'),
})

console.log('Querying narrow range around proposal block 42319886...')

try {
  const logs = await client.getLogs({
    address: GOVERNOR_ADDRESS,
    event: parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
    fromBlock: BigInt(42319000),
    toBlock: BigInt(42320000),
  })

  console.log(`\nFound ${logs.length} proposals in range`)
  logs.forEach(log => {
    console.log('\nProposal ID:', log.args.proposalId?.toString())
    console.log('Proposer:', log.args.proposer)
    console.log('Block:', log.blockNumber)
  })
} catch (error) {
  console.error('Error:', error.message)
  if (error.details) console.error('Details:', error.details)
}
