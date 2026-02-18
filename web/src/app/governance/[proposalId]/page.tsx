'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'
import { VoteButtons } from '@/components/VoteButtons'
import { WalletConnect } from '@/components/WalletConnect'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const GOVERNOR_ABI = [
  parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
  parseAbiItem('function state(uint256 proposalId) view returns (uint8)'),
  parseAbiItem('function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)'),
] as const

const PROPOSAL_STATES = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed']

interface ProposalDetails {
  id: string
  fullId: string
  proposer: string
  description: string
  voteStart: bigint
  voteEnd: bigint
  state: string
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
  targets: string[]
  values: bigint[]
  calldatas: string[]
}

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = params.proposalId as string

  const [proposal, setProposal] = useState<ProposalDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProposal() {
      try {
        const client = createPublicClient({
          chain: base,
          transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
        })

        // Fetch current block number
        const currentBlock = await client.getBlockNumber()
        
        // Fetch ProposalCreated events in chunks (Alchemy has 10k block limit)
        const fromBlock = BigInt(42290000)
        const chunkSize = BigInt(10000)
        
        type ProposalLog = {
          args: {
            proposalId: bigint
            proposer: string
            description: string
            voteStart: bigint
            voteEnd: bigint
            targets: readonly string[]
            values: readonly bigint[]
            calldatas: readonly string[]
          }
        }
        
        // Build chunk ranges
        const chunks: Array<{ start: bigint; end: bigint }> = []
        for (let startBlock = fromBlock; startBlock <= currentBlock; startBlock += chunkSize) {
          const endBlock = startBlock + chunkSize > currentBlock ? currentBlock : startBlock + chunkSize - BigInt(1)
          chunks.push({ start: startBlock, end: endBlock })
        }
        
        // Query all chunks in parallel for speed
        const chunkResults = await Promise.all(
          chunks.map(chunk => 
            client.getLogs({
              address: GOVERNOR_ADDRESS,
              event: GOVERNOR_ABI[0],
              fromBlock: chunk.start,
              toBlock: chunk.end,
            })
          )
        )
        
        const allLogs = chunkResults.flat() as ProposalLog[]

        // Find proposal by short ID (prefix match) or full ID
        const searchId = proposalId.toLowerCase()
        const log = allLogs.find(l => {
          const fullHex = `0x${l.args.proposalId.toString(16)}`
          const decimal = l.args.proposalId.toString()
          
          // Support short hex (0x46dc649e), full hex, or decimal
          return fullHex.toLowerCase().startsWith(searchId) || 
                 fullHex.toLowerCase() === searchId ||
                 decimal === proposalId
        })

        if (!log) {
          setError('Proposal not found')
          setLoading(false)
          return
        }

        const { proposalId: fullProposalId, proposer, description, voteStart, voteEnd, targets, values, calldatas } = log.args

        // Get both full and short IDs
        const fullHex = `0x${fullProposalId.toString(16)}`
        const shortId = fullHex.slice(0, 10)

        // Fetch current state and votes using full proposal ID
        const state = await client.readContract({
          address: GOVERNOR_ADDRESS,
          abi: GOVERNOR_ABI,
          functionName: 'state',
          args: [fullProposalId],
        })

        const votes = await client.readContract({
          address: GOVERNOR_ADDRESS,
          abi: GOVERNOR_ABI,
          functionName: 'proposalVotes',
          args: [fullProposalId],
        })

        setProposal({
          id: shortId,
          fullId: fullHex,
          proposer: proposer,
          description: description,
          voteStart: voteStart,
          voteEnd: voteEnd,
          state: PROPOSAL_STATES[state] || 'Unknown',
          againstVotes: votes[0],
          forVotes: votes[1],
          abstainVotes: votes[2],
          targets: targets as string[],
          values: values as bigint[],
          calldatas: calldatas as string[],
        })
      } catch (err) {
        console.error('Error fetching proposal:', err)
        setError('Failed to load proposal')
      } finally {
        setLoading(false)
      }
    }

    if (proposalId) {
      fetchProposal()
    }
  }, [proposalId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => router.push('/governance')}
          className="text-nouns-blue hover:text-nouns-text transition-colors"
        >
          ← Back to Governance
        </button>
        <div className="bg-nouns-surface rounded-xl p-8 text-center border border-nouns-border">
          <p className="text-nouns-muted">Loading proposal...</p>
        </div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => router.push('/governance')}
          className="text-nouns-blue hover:text-nouns-text transition-colors"
        >
          ← Back to Governance
        </button>
        <div className="bg-nouns-surface rounded-xl p-8 text-center border border-nouns-border">
          <p className="text-red-500">{error || 'Proposal not found'}</p>
        </div>
      </div>
    )
  }

  const stateColors: Record<string, string> = {
    Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    Active: 'bg-green-500/10 text-green-500 border-green-500/30',
    Succeeded: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    Defeated: 'bg-red-500/10 text-red-500 border-red-500/30',
    Executed: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    Queued: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    Canceled: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
    Expired: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  }

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
  const forPercent = totalVotes > 0n ? Number((proposal.forVotes * 100n) / totalVotes) : 0
  const againstPercent = totalVotes > 0n ? Number((proposal.againstVotes * 100n) / totalVotes) : 0
  const abstainPercent = totalVotes > 0n ? Number((proposal.abstainVotes * 100n) / totalVotes) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/governance')}
        className="text-nouns-blue hover:text-nouns-text transition-colors text-lg"
      >
        ← Back to Governance
      </button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-4 py-2 rounded-lg text-base font-medium border ${stateColors[proposal.state] || 'bg-gray-500/10 text-gray-500'}`}>
            {proposal.state}
          </span>
          <span className="text-nouns-muted">Proposal #{proposal.id}</span>
        </div>

        <h1 className="text-3xl font-bold text-nouns-text">
          {proposal.description.split('\n')[0] || 'Untitled Proposal'}
        </h1>

        <div className="flex items-center gap-2 text-sm text-nouns-muted">
          <span>Proposer:</span>
          <a
            href={`https://basescan.org/address/${proposal.proposer}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nouns-blue hover:underline"
          >
            {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
          </a>
        </div>
      </div>

      {/* Description */}
      <div className="bg-nouns-surface rounded-xl p-6 border border-nouns-border">
        <h2 className="text-xl font-bold text-nouns-text mb-4">Description</h2>
        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-nouns-text prose-p:text-nouns-muted prose-a:text-nouns-blue prose-strong:text-nouns-text prose-ul:text-nouns-muted prose-ol:text-nouns-muted">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {proposal.description}
          </ReactMarkdown>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-nouns-surface rounded-xl p-6 border border-nouns-border">
        <h2 className="text-xl font-bold text-nouns-text mb-4">Actions</h2>
        <div className="space-y-4">
          {proposal.targets.map((target, idx) => (
            <div key={idx} className="bg-nouns-bg rounded-lg p-4 border border-nouns-border">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-nouns-muted min-w-20">Target:</span>
                  <a
                    href={`https://basescan.org/address/${target}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-nouns-blue hover:underline break-all"
                  >
                    {target}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-nouns-muted min-w-20">Value:</span>
                  <span className="text-nouns-text">{proposal.values[idx].toString()} wei</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-nouns-muted min-w-20">Calldata:</span>
                  <code className="text-nouns-text break-all text-xs bg-nouns-surface px-2 py-1 rounded">
                    {proposal.calldatas[idx] || '0x'}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voting Results */}
      <div className="bg-nouns-surface rounded-xl p-6 border border-nouns-border">
        <h2 className="text-xl font-bold text-nouns-text mb-4">Votes</h2>
        
        {totalVotes === 0n ? (
          <p className="text-nouns-muted text-center py-4">No votes cast yet</p>
        ) : (
          <div className="space-y-4">
            {/* Vote bars */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-500 font-medium">For</span>
                  <span className="text-nouns-muted">{proposal.forVotes.toString()} ({forPercent}%)</span>
                </div>
                <div className="h-3 bg-nouns-bg rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${forPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-red-500 font-medium">Against</span>
                  <span className="text-nouns-muted">{proposal.againstVotes.toString()} ({againstPercent}%)</span>
                </div>
                <div className="h-3 bg-nouns-bg rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-500 font-medium">Abstain</span>
                  <span className="text-nouns-muted">{proposal.abstainVotes.toString()} ({abstainPercent}%)</span>
                </div>
                <div className="h-3 bg-nouns-bg rounded-full overflow-hidden">
                  <div className="h-full bg-gray-500" style={{ width: `${abstainPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-nouns-border">
              <div className="flex items-center justify-between">
                <span className="text-nouns-muted">Total Votes</span>
                <span className="text-nouns-text font-medium">{totalVotes.toString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wallet connection */}
      <div className="flex justify-end">
        <WalletConnect />
      </div>

      {/* Voting */}
      <VoteButtons proposalId={proposal.fullId} proposalState={proposal.state} />
    </div>
  )
}
