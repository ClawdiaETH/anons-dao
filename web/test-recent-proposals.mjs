import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const client = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/GFFnS7_zmrBjrUOpH-W5n'),
})

console.log('Querying recent blocks (42300000 to latest)...')

try {
  const logs = await client.getLogs({
    address: GOVERNOR_ADDRESS,
    event: parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
    fromBlock: BigInt(42300000),
    toBlock: 'latest',
  })

  console.log(`\nFound ${logs.length} proposals`)
  logs.forEach(log => {
    console.log('\n---')
    console.log('Proposal ID:', log.args.proposalId?.toString())
    console.log('Proposer:', log.args.proposer)
    console.log('Block:', log.blockNumber)
    console.log('Description:', log.args.description?.substring(0, 150))
  })
} catch (error) {
  console.error('Error:', error.message)
}
