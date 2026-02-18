'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const GOVERNOR_ABI = [
  parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)'),
  parseAbiItem('function state(uint256 proposalId) view returns (uint8)'),
  parseAbiItem('function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)'),
] as const

const PROPOSAL_STATES = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed']

interface Proposal {
  id: string
  proposer: string
  description: string
  voteStart: bigint
  voteEnd: bigint
  state: string
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
}

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProposals() {
      try {
        const client = createPublicClient({
          chain: base,
          transport: http(),
        })

        // Fetch ProposalCreated events (from Governor deployment block)
        // Governor was deployed around block 42000000 on Base
        const logs = await client.getLogs({
          address: GOVERNOR_ADDRESS,
          event: GOVERNOR_ABI[0],
          fromBlock: BigInt(42000000),
          toBlock: 'latest',
        })

        // Fetch state and votes for each proposal
        const proposalsData = await Promise.all(
          logs.map(async (log) => {
            const { proposalId, proposer, description, voteStart, voteEnd } = log.args

            const state = await client.readContract({
              address: GOVERNOR_ADDRESS,
              abi: GOVERNOR_ABI,
              functionName: 'state',
              args: [proposalId!],
            })

            const votes = await client.readContract({
              address: GOVERNOR_ADDRESS,
              abi: GOVERNOR_ABI,
              functionName: 'proposalVotes',
              args: [proposalId!],
            })

            return {
              id: proposalId!.toString(),
              proposer: proposer!,
              description: description!,
              voteStart: voteStart!,
              voteEnd: voteEnd!,
              state: PROPOSAL_STATES[state] || 'Unknown',
              againstVotes: votes[0],
              forVotes: votes[1],
              abstainVotes: votes[2],
            }
          })
        )

        setProposals(proposalsData.reverse()) // Most recent first
      } catch (error) {
        console.error('Error fetching proposals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [])

  const activeProposals = proposals.filter(p => p.state === 'Active' || p.state === 'Pending')
  const pastProposals = proposals.filter(p => !['Active', 'Pending'].includes(p.state))

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-nouns-text">Governance</h1>
        <div className="bg-nouns-surface rounded-xl p-8 text-center border border-nouns-border">
          <p className="text-nouns-muted">Loading proposals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-nouns-text">Governance</h1>
        <button
          disabled
          className="px-4 py-2 bg-nouns-blue/20 text-nouns-blue rounded-lg font-medium opacity-50 cursor-not-allowed"
        >
          Create Proposal
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-nouns-blue/10 border border-nouns-blue/30 rounded-xl p-4">
        <p className="text-nouns-blue">
          Connect your ERC-8004 registered agent wallet and hold at least 1 Anon to participate in governance.
        </p>
      </div>

      {/* Active Proposals */}
      <section>
        <h2 className="text-xl font-bold text-nouns-text mb-4">Active Proposals</h2>
        {activeProposals.length === 0 ? (
          <div className="bg-nouns-surface rounded-xl p-8 text-center border border-nouns-border">
            <p className="text-nouns-muted">No active proposals</p>
            <p className="text-nouns-muted/60 text-sm mt-2">
              Proposals will appear here once created by Anon holders
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </section>

      {/* Past Proposals */}
      <section>
        <h2 className="text-xl font-bold text-nouns-text mb-4">Past Proposals</h2>
        {pastProposals.length === 0 ? (
          <div className="bg-nouns-surface rounded-xl p-8 text-center border border-nouns-border">
            <p className="text-nouns-muted">No past proposals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </section>

      {/* Governance Stats */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">Quorum</p>
          <p className="text-2xl font-bold text-nouns-text">1 Anon</p>
        </div>
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">Voting Period</p>
          <p className="text-2xl font-bold text-nouns-text">48 hours</p>
        </div>
        <div className="bg-nouns-surface rounded-xl p-4 border border-nouns-border">
          <p className="text-nouns-muted text-sm">Timelock Delay</p>
          <p className="text-2xl font-bold text-nouns-text">24 hours</p>
        </div>
      </section>
    </div>
  )
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
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

  return (
    <div className="bg-nouns-surface rounded-xl p-6 border border-nouns-border hover:border-nouns-blue/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${stateColors[proposal.state] || 'bg-gray-500/10 text-gray-500'}`}>
              {proposal.state}
            </span>
            <span className="text-sm text-nouns-muted">Proposal #{proposal.id}</span>
          </div>
          <p className="text-lg font-semibold text-nouns-text mb-2">
            {proposal.description.split('\n')[0] || 'Untitled Proposal'}
          </p>
          <p className="text-sm text-nouns-muted">
            Proposer: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
          </p>
        </div>
      </div>

      {/* Vote Results */}
      {totalVotes > 0n && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-500">For: {proposal.forVotes.toString()} ({forPercent}%)</span>
            <span className="text-red-500">Against: {proposal.againstVotes.toString()} ({againstPercent}%)</span>
          </div>
          <div className="h-2 bg-nouns-bg rounded-full overflow-hidden flex">
            {forPercent > 0 && (
              <div className="bg-green-500" style={{ width: `${forPercent}%` }} />
            )}
            {againstPercent > 0 && (
              <div className="bg-red-500" style={{ width: `${againstPercent}%` }} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
