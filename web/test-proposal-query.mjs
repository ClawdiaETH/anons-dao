import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const GOVERNOR_ABI = [
  parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
]

const client = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
})

console.log('Querying for ProposalCreated events from block 42000000...')
console.log('Using RPC:', process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')

try {
  const logs = await client.getLogs({
    address: GOVERNOR_ADDRESS,
    event: GOVERNOR_ABI[0],
    fromBlock: BigInt(42000000),
    toBlock: 'latest',
  })

  console.log(`\nFound ${logs.length} proposals:`)
  logs.forEach(log => {
    console.log('\nProposal ID:', log.args.proposalId?.toString())
    console.log('Proposer:', log.args.proposer)
    console.log('Vote Start Block:', log.args.voteStart?.toString())
    console.log('Vote End Block:', log.args.voteEnd?.toString())
    console.log('Description (first 100 chars):', log.args.description?.substring(0, 100))
    console.log('Block Number:', log.blockNumber)
  })
} catch (error) {
  console.error('Error:', error.message)
  if (error.cause) console.error('Cause:', error.cause)
}
