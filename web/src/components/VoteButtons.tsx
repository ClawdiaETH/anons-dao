'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseAbiItem } from 'viem'

const GOVERNOR_ADDRESS = '0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B'

const GOVERNOR_ABI = [
  parseAbiItem('function castVote(uint256 proposalId, uint8 support) returns (uint256)'),
] as const

interface VoteButtonsProps {
  proposalId: string
  proposalState: string
}

export function VoteButtons({ proposalId, proposalState }: VoteButtonsProps) {
  const { address, isConnected } = useAccount()
  const [voting, setVoting] = useState(false)
  const [votedFor, setVotedFor] = useState<number | null>(null)

  const { writeContract, data: hash, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleVote = async (support: number) => {
    setVoting(true)
    setVotedFor(support)

    try {
      await writeContract({
        address: GOVERNOR_ADDRESS,
        abi: GOVERNOR_ABI,
        functionName: 'castVote',
        args: [BigInt(proposalId), support],
      })
    } catch (err) {
      console.error('Vote failed:', err)
      setVoting(false)
      setVotedFor(null)
    }
  }

  if (proposalState !== 'Active') {
    return (
      <div className="bg-nouns-surface border border-nouns-border rounded-xl p-6 text-center">
        <p className="text-nouns-muted">
          Voting is only available when proposal is Active
        </p>
        <p className="text-sm text-nouns-muted/60 mt-2">
          Current state: {proposalState}
        </p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="bg-nouns-blue/10 border border-nouns-blue/30 rounded-xl p-6 text-center">
        <p className="text-nouns-blue mb-4">
          Connect your wallet to vote
        </p>
        <p className="text-sm text-nouns-muted">
          You must own at least 1 Anon NFT and be ERC-8004 registered
        </p>
      </div>
    )
  }

  if (isSuccess) {
    const voteType = votedFor === 1 ? 'For' : votedFor === 0 ? 'Against' : 'Abstain'
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
        <p className="text-green-500 text-lg font-medium mb-2">
          ✓ Vote cast successfully!
        </p>
        <p className="text-nouns-muted text-sm">
          You voted: {voteType}
        </p>
        {hash && (
          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nouns-blue hover:underline text-sm mt-2 inline-block"
          >
            View transaction
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="bg-nouns-surface border border-nouns-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-nouns-text mb-4">Cast Your Vote</h3>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-500 text-sm">
            {error.message.includes('insufficient') 
              ? 'Insufficient voting power. You must own at least 1 Anon NFT.' 
              : 'Transaction failed. Check console for details.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleVote(1)}
          disabled={voting || isConfirming}
          className="px-6 py-4 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {voting && votedFor === 1 ? (
            isConfirming ? 'Confirming...' : 'Signing...'
          ) : (
            'For'
          )}
        </button>

        <button
          onClick={() => handleVote(0)}
          disabled={voting || isConfirming}
          className="px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {voting && votedFor === 0 ? (
            isConfirming ? 'Confirming...' : 'Signing...'
          ) : (
            'Against'
          )}
        </button>

        <button
          onClick={() => handleVote(2)}
          disabled={voting || isConfirming}
          className="px-6 py-4 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border border-gray-500/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {voting && votedFor === 2 ? (
            isConfirming ? 'Confirming...' : 'Signing...'
          ) : (
            'Abstain'
          )}
        </button>
      </div>

      <p className="text-xs text-nouns-muted mt-4 text-center">
        Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
      </p>
    </div>
  )
}
