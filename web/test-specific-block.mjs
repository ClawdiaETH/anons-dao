import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const client = createPublicClient({
  chain: base,
  transport: http('https://base.llamarpc.com'),
})

console.log('Querying specific block 42319886...')

try {
  // Query without event filter first to see all logs
  const allLogs = await client.getLogs({
    address: GOVERNOR_ADDRESS,
    fromBlock: BigInt(42319886),
    toBlock: BigInt(42319886),
  })

  console.log(`\nFound ${allLogs.length} total logs from Governor contract`)
  
  allLogs.forEach((log, i) => {
    console.log(`\nLog ${i}:`)
    console.log('Topics:', log.topics)
  })

  // Now try with event filter
  const eventLogs = await client.getLogs({
    address: GOVERNOR_ADDRESS,
    event: parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
    fromBlock: BigInt(42319886),
    toBlock: BigInt(42319886),
  })

  console.log(`\nWith event filter: ${eventLogs.length} ProposalCreated events`)
} catch (error) {
  console.error('Error:', error.message)
}
