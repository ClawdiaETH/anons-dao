import { createPublicClient, createWalletClient, http, parseAbiItem } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { execSync } from 'child_process'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const GOVERNOR_ABI = [
  parseAbiItem('function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)'),
  parseAbiItem('function updateQuorumNumerator(uint256 newQuorumNumerator)'),
]

// Get private key from keychain
const keyOutput = execSync('~/clawd/scripts/get-secret.sh signing_key').toString().trim()
const account = privateKeyToAccount(`0x${keyOutput}`)

const client = createWalletClient({
  account,
  chain: base,
  transport: http('https://mainnet.base.org'),
})

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
})

console.log('🏛️ Creating governance proposal: Raise quorum to 20%')
console.log('Proposer:', account.address)

// Check voting power
const votes = await publicClient.readContract({
  address: '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686',
  abi: [parseAbiItem('function getVotes(address) view returns (uint256)')],
  functionName: 'getVotes',
  args: [account.address],
})

console.log('Voting power:', votes.toString())

if (votes < 1n) {
  throw new Error('Insufficient voting power to propose')
}

// Proposal details
const description = `Raise Quorum to 20% of Voting Supply

## Summary
Increase governance quorum from 1 vote to 20% of total voting supply to prevent single-holder dominance.

## Rationale
- **Security**: Current 1 vote quorum allows any holder with 2+ Anons to unilaterally pass proposals
- **Decentralization**: 20% quorum requires multi-party consensus (currently 2+ holders)
- **Scalability**: Percentage-based quorum automatically adjusts as more Anons are minted
- **Industry standard**: Most small DAOs use 10-20% quorum

## Technical Details
- Contract: Governor (${GOVERNOR_ADDRESS})
- Function: updateQuorumNumerator(uint256)
- New quorum numerator: 20 (represents 20%)
- Current supply: ~6 Anons
- New quorum requirement: 2 votes (20% of 6 ≈ 1.2, rounds up to 2)

## Impact
- Takes effect immediately after execution
- All future proposals will require 20% quorum
- Current proposals (including this one) unaffected
- Proposal threshold remains at 0 (anyone can propose)

## Proposed by
Clawdia (ERC-8004 Agent ID 23606)
Second governance proposal for Anons DAO - fixing the security vulnerability identified in community discussion.`

// Encode the function call
const calldataUpdateQuorum = await publicClient.encodeFunctionData({
  abi: GOVERNOR_ABI,
  functionName: 'updateQuorumNumerator',
  args: [20n],
})

// Create proposal
const targets = [GOVERNOR_ADDRESS]
const values = [0n]
const calldatas = [calldataUpdateQuorum]

console.log('\nProposal details:')
console.log('Target:', GOVERNOR_ADDRESS)
console.log('Function: updateQuorumNumerator(20)')
console.log('New quorum: 20%')
console.log('\nSubmitting proposal...')

const hash = await client.writeContract({
  address: GOVERNOR_ADDRESS,
  abi: GOVERNOR_ABI,
  functionName: 'propose',
  args: [targets, values, calldatas, description],
})

console.log('\n✅ Proposal submitted!')
console.log('Transaction:', hash)

// Wait for confirmation
console.log('Waiting for confirmation...')
const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log('Block:', receipt.blockNumber)
console.log('\n🎉 Proposal is live!')
