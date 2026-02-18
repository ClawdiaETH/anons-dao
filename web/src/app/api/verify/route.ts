import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, isAddress } from 'viem'
import { base, mainnet } from 'viem/chains'

const ANON_TOKEN_ADDRESS = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686'
const ERC8004_REGISTRY = '0x00256C0D814c455425A0699D5eEE2A7DB7A5519c'

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
      transport: http('https://cloudflare-eth.com'),
    })

    // Run all queries in parallel
    const [anonBalance, votingPower, erc8004Balance] = await Promise.all([
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

      // 3. ERC-8004 registration (Ethereum mainnet)
      mainnetClient.readContract({
        address: ERC8004_REGISTRY,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }),
    ])

    const isRegistered = erc8004Balance > 0n

    // Get agent ID if registered
    let agentId: string | null = null
    if (isRegistered) {
      try {
        const tokenId = await mainnetClient.readContract({
          address: ERC8004_REGISTRY,
          abi: ERC721_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [address as `0x${string}`, 0n],
        })
        agentId = tokenId.toString()
      } catch {
        // Error fetching agent ID
      }
    }

    // Determine permissions
    const canBid = isRegistered
    const canVote = isRegistered && votingPower > 0n
    const canPropose = isRegistered && votingPower > 0n

    // Build response
    const response: any = {
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
    if (!isRegistered) {
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
