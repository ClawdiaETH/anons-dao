import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// CORRECT addresses from contracts.ts
const TOKEN_ADDRESS = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686'
const AUCTION_HOUSE_ADDRESS = '0x51f5a9252A43F89D8eE9D5616263f46a0E02270F'

const auctionHouseABI = [
  {
    type: 'function',
    name: 'auction',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'anonId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'bidder', type: 'address' },
          { name: 'settled', type: 'bool' },
          { name: 'isDusk', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
]

const tokenABI = [
  {
    name: 'seeds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'background', type: 'uint8' },
          { name: 'head', type: 'uint8' },
          { name: 'visor', type: 'uint8' },
          { name: 'antenna', type: 'uint8' },
          { name: 'body', type: 'uint8' },
          { name: 'accessory', type: 'uint8' },
          { name: 'isDusk', type: 'bool' },
        ],
      },
    ],
  },
]

const BACKGROUNDS = [
  '#e1d7d5', // 0: Dawn Sky
  '#f5e6d3', // 1: Dawn Clouds
  '#d5d7e1', // 2: Dusk Sky
  '#d5e1e1', // 3: Dusk Clouds
]

function getBackgroundColor(seed) {
  const half = BACKGROUNDS.length / 2
  if (seed.isDusk) {
    return BACKGROUNDS[half + (seed.background % half)]
  } else {
    return BACKGROUNDS[seed.background % half]
  }
}

async function testSeed() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    console.log('Using RPC:', rpcUrl)
    
    const client = createPublicClient({
      chain: base,
      transport: http(rpcUrl, { timeout: 10000 }),
    })

    console.log('\n1. Fetching current auction...')
    const auctionData = await client.readContract({
      address: AUCTION_HOUSE_ADDRESS,
      abi: auctionHouseABI,
      functionName: 'auction',
    })
    
    console.log('Raw auction data:', auctionData)
    console.log('Type:', typeof auctionData)
    console.log('Keys:', Object.keys(auctionData))
    
    // Access as object properties
    const anonId = auctionData.anonId
    const isDusk = auctionData.isDusk
    const bidder = auctionData.bidder
    
    console.log('Auction:', {
      anonId: anonId?.toString(),
      isDusk,
      bidder,
      settled: auctionData.settled,
    })

    console.log('\n2. Fetching seed for Anon #3 (the problematic one)...')
    const seedData = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: tokenABI,
      functionName: 'seeds',
      args: [3n],
    })

    console.log('Raw seed data:', seedData)
    console.log('Type:', typeof seedData)
    console.log('Keys:', Object.keys(seedData))

    const seed = {
      background: Number(seedData.background),
      head: Number(seedData.head),
      visor: Number(seedData.visor),
      antenna: Number(seedData.antenna),
      body: Number(seedData.body),
      accessory: Number(seedData.accessory),
      isDusk: Boolean(seedData.isDusk),
    }

    console.log('Parsed seed:', seed)
    
    const bgColor = getBackgroundColor(seed)
    console.log('\n3. Background color calculation:')
    console.log('  Half:', BACKGROUNDS.length / 2)
    console.log('  seed.isDusk:', seed.isDusk)
    console.log('  seed.background:', seed.background)
    console.log('  Formula: BACKGROUNDS[2 + (1 % 2)] = BACKGROUNDS[3]')
    console.log('  Result:', bgColor)
    console.log('\n  Expected: #d5e1e1 (cyan)')
    console.log('  Match:', bgColor === '#d5e1e1' ? '✅' : '❌')

    console.log('\n4. Testing current auction seed...')
    const currentSeedData = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: tokenABI,
      functionName: 'seeds',
      args: [anonId],
    })

    const currentSeed = {
      background: Number(currentSeedData.background),
      head: Number(currentSeedData.head),
      visor: Number(currentSeedData.visor),
      antenna: Number(currentSeedData.antenna),
      body: Number(currentSeedData.body),
      accessory: Number(currentSeedData.accessory),
      isDusk: Boolean(currentSeedData.isDusk),
    }

    console.log('Current Anon seed:', currentSeed)
    console.log('Current Anon bgColor:', getBackgroundColor(currentSeed))

  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  }
}

testSeed()
