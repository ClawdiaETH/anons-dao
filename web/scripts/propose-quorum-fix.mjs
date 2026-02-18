import { createPublicClient, http, parseAbiItem, encodeFunctionData } from 'viem'
import { base } from 'viem/chains'
import { execSync } from 'child_process'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'
const MY_ADDRESS = '0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9'

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
})

console.log('🏛️ Preparing governance proposal: Raise quorum to 20%')
console.log('Proposer:', MY_ADDRESS)

// Check voting power
const votes = await client.readContract({
  address: '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686',
  abi: [parseAbiItem('function getVotes(address) view returns (uint256)')],
  functionName: 'getVotes',
  args: [MY_ADDRESS],
})

console.log('Voting power:', votes.toString())

// Encode the updateQuorumNumerator call
const calldata = encodeFunctionData({
  abi: [parseAbiItem('function updateQuorumNumerator(uint256 newQuorumNumerator)')],
  functionName: 'updateQuorumNumerator',
  args: [20n],
})

console.log('\n📋 Proposal parameters:')
console.log('Target:', GOVERNOR_ADDRESS)
console.log('Value: 0')
console.log('Calldata:', calldata)

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

console.log('\n📝 Description length:', description.length, 'characters')
console.log('\n✅ Ready to submit. Run:')
console.log(`\ncast send ${GOVERNOR_ADDRESS} \\
  "propose(address[],uint256[],bytes[],string)" \\
  "[${GOVERNOR_ADDRESS}]" \\
  "[0]" \\
  "[${calldata}]" \\
  "${description.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" \\
  --private-key \$(~/clawd/scripts/get-secret.sh signing_key) \\
  --rpc-url https://mainnet.base.org`)
