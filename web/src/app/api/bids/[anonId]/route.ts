import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const AUCTION_HOUSE_ADDRESS = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F' as const

export async function GET(
  request: NextRequest,
  { params }: { params: { anonId: string } }
) {
  try {
    const anonId = BigInt(params.anonId)
    
    // Use Alchemy RPC from env or fallback to public
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    
    const client = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n

    const logs = await client.getLogs({
      address: AUCTION_HOUSE_ADDRESS,
      event: parseAbiItem('event AuctionBid(uint256 indexed anonId, address indexed bidder, uint256 amount, bool extended)'),
      args: { anonId },
      fromBlock,
      toBlock: 'latest',
    })

    const bids = await Promise.all(
      logs.map(async (log) => {
        const block = await client.getBlock({ blockNumber: log.blockNumber })
        return {
          bidder: log.args.bidder,
          amount: log.args.amount?.toString(),
          extended: log.args.extended,
          timestamp: Number(block.timestamp),
          blockNumber: log.blockNumber.toString(),
        }
      })
    )

    // Sort by block number descending
    bids.sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)))

    return NextResponse.json({ bids })
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}
