import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const client = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/MNuDEFFEymzF6IuMa1r1o'),
})

console.log('Testing chunked query...')

const currentBlock = await client.getBlockNumber()
console.log('Current block:', currentBlock)

const fromBlock = BigInt(42290000)
const chunkSize = BigInt(10000)
let allLogs = []

for (let startBlock = fromBlock; startBlock <= currentBlock; startBlock += chunkSize) {
  const endBlock = startBlock + chunkSize > currentBlock ? currentBlock : startBlock + chunkSize - BigInt(1)
  
  console.log(`Querying ${startBlock} → ${endBlock}...`)
  
  const chunkLogs = await client.getLogs({
    address: GOVERNOR_ADDRESS,
    event: parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
    fromBlock: startBlock,
    toBlock: endBlock,
  })
  
  console.log(`  Found ${chunkLogs.length} proposals`)
  allLogs = [...allLogs, ...chunkLogs]
}

console.log(`\n✅ Total: ${allLogs.length} proposals`)
if (allLogs.length > 0) {
  console.log('First proposal ID:', allLogs[0].args.proposalId?.toString())
}
