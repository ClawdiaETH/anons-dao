'use client'

import { useReadContract } from 'wagmi'
import { TOKEN_ADDRESS, tokenABI } from '../contracts'
import { CHAIN_ID } from '../wagmi'
import { useMemo } from 'react'

export interface TokenMetadata {
  name: string
  description: string
  image: string // SVG data URI
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

export function useTokenURI(tokenId: bigint | undefined) {
  const { data: uri, isLoading, error } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenABI,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: tokenId !== undefined && !!TOKEN_ADDRESS,
    },
  })

  const metadata = useMemo<TokenMetadata | undefined>(() => {
    if (!uri || typeof uri !== 'string') return undefined

    try {
      // URI format: data:application/json;base64,{base64 encoded JSON}
      const base64Data = uri.replace('data:application/json;base64,', '')
      const jsonString = atob(base64Data)
      return JSON.parse(jsonString) as TokenMetadata
    } catch {
      return undefined
    }
  }, [uri])

  return {
    metadata,
    isLoading,
    error,
  }
}
