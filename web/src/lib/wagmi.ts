import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || base.id
