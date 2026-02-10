import { useReadContract } from 'wagmi'
import { TOKEN_ADDRESS, tokenABI, Seed } from '@/lib/contracts'

interface UseSeedResult {
  seed: Seed | undefined
  isLoading: boolean
  error: Error | null
}

export function useSeed(tokenId: bigint): UseSeedResult {
  const { data, isLoading, error } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenABI,
    functionName: 'seeds',
    args: [tokenId],
  })

  // Contract returns tuple: [background, head, visor, antenna, body, accessory, isDusk]
  let seed: Seed | undefined = undefined
  if (data && Array.isArray(data)) {
    seed = {
      background: Number(data[0]),
      head: Number(data[1]),
      visor: Number(data[2]),
      antenna: Number(data[3]),
      body: Number(data[4]),
      accessory: Number(data[5]),
      isDusk: Boolean(data[6]),
    }
  }

  return {
    seed,
    isLoading,
    error: error as Error | null,
  }
}
