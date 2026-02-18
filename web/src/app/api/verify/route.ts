import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, isAddress } from 'viem'
import { base, mainnet } from 'viem/chains'

const ANON_TOKEN_ADDRESS = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686'
const ERC8004_REGISTRY = '0x00256C0D814c455425A0699D5eEE2A7DB7A5519c'

export const dynamic = 'force-dynamic'

const ERC721_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getVotes',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  // Validate address
  if (!address) {
    return NextResponse.json(
      { success: false, error: 'Missing address parameter' },
      { status: 400 }
    )
  }

  if (!isAddress(address)) {
    return NextResponse.json(
      { success: false, error: 'Invalid Ethereum address' },
      { status: 400 }
    )
  }

  try {
    // Create clients
    const baseClient = createPublicClient({
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    })

    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.public-rpc.com'),
    })

    // Query Base chain data
    const [anonBalance, votingPower] = await Promise.all([
      // 1. Anon NFT balance (Base)
      baseClient.readContract({
        address: ANON_TOKEN_ADDRESS,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }),

      // 2. Voting power (Base)
      baseClient.readContract({
        address: ANON_TOKEN_ADDRESS,
        abi: ERC721_ABI,
        functionName: 'getVotes',
        args: [address as `0x${string}`],
      }),
    ])

    // ERC-8004 check (Ethereum mainnet) - attempt but don't fail if unavailable
    let isRegistered = false
    let agentId: string | null = null
    
    try {
      const erc8004Balance = await mainnetClient.readContract({
        address: ERC8004_REGISTRY,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      })

      isRegistered = erc8004Balance > 0n

      if (isRegistered) {
        const tokenId = await mainnetClient.readContract({
          address: ERC8004_REGISTRY,
          abi: ERC721_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [address as `0x${string}`, 0n],
        })
        agentId = tokenId.toString()
      }
    } catch (error) {
      // Mainnet RPC unavailable - continue with Base data only
      console.warn('ERC-8004 check failed:', error)
    }

    // Determine permissions
    const canBid = isRegistered
    const canVote = isRegistered && votingPower > 0n
    const canPropose = isRegistered && votingPower > 0n

    // Build response
    const response: {
      success: boolean
      address: string
      anon_balance: number
      erc8004_registered: boolean
      agent_id: string | null
      voting_power: number
      can_bid: boolean
      can_vote: boolean
      can_propose: boolean
      message?: string
      requirements?: string[]
    } = {
      success: true,
      address,
      anon_balance: Number(anonBalance),
      erc8004_registered: isRegistered,
      agent_id: agentId,
      voting_power: Number(votingPower),
      can_bid: canBid,
      can_vote: canVote,
      can_propose: canPropose,
    }

    // Add helpful messages
    if (agentId === null && anonBalance > 0n) {
      response.message = 'ERC-8004 registration check unavailable (mainnet RPC issues) — verify manually at 8004scan.io'
    } else if (!isRegistered) {
      response.message = 'Must register with ERC-8004 registry (0x00256C0D814c455425A0699D5eEE2A7DB7A5519c on Ethereum mainnet)'
    } else if (anonBalance === 0n) {
      response.message = 'Must own at least 1 Anon NFT (bid on auctions at anons.lol)'
    } else if (votingPower === 0n) {
      response.message = 'Must self-delegate to activate voting power (call token.delegate(yourAddress))'
    } else {
      response.message = 'Fully verified — ready to participate in Anons DAO'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify address',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
