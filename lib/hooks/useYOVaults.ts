import useSWR from 'swr'
import { YO_VAULTS, REFRESH_INTERVALS } from '../constants'
import type { VaultMetadata } from '@/types'

/**
 * Return type for useYOVaults hook
 */
export interface UseYOVaultsReturn {
  vaults: VaultMetadata[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// Fallback APYs (used if API fetch fails)
const FALLBACK_APY: Record<string, number> = {
  [YO_VAULTS[0].address.toLowerCase()]: 8.5,
  [YO_VAULTS[1].address.toLowerCase()]: 6.2,
  [YO_VAULTS[2].address.toLowerCase()]: 5.8,
  [YO_VAULTS[3].address.toLowerCase()]: 7.1,
}

async function fetchAllVaultStats(): Promise<Record<string, { apy: number; tvl: bigint }>> {
  const results: Record<string, { apy: number; tvl: bigint }> = {}
  await Promise.allSettled(
    YO_VAULTS.map(async (v) => {
      try {
        const res = await fetch(`https://api.yo.xyz/api/v1/vault/base/${v.address}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const stats = json?.data?.stats
        const apy = parseFloat(stats?.yield?.['30d'] ?? stats?.yield?.['7d'] ?? stats?.yield?.['1d'] ?? '0')
        const tvlRaw = parseFloat(stats?.tvl?.raw ?? '0')
        results[v.address.toLowerCase()] = {
          apy: isNaN(apy) ? (FALLBACK_APY[v.address.toLowerCase()] ?? 0) : apy,
          tvl: BigInt(Math.floor(tvlRaw)),
        }
      } catch {
        results[v.address.toLowerCase()] = {
          apy: FALLBACK_APY[v.address.toLowerCase()] ?? 0,
          tvl: 0n,
        }
      }
    })
  )
  return results
}

/**
 * Fetches vault metadata for all YO Protocol vaults.
 * APY and TVL come from the YO REST API (api.yo.xyz).
 * Falls back to hardcoded values if the API is unavailable.
 * Cached with SWR, revalidates every 5 minutes.
 */
export function useYOVaults(): UseYOVaultsReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'yo-vaults-all',
    fetchAllVaultStats,
    {
      refreshInterval: REFRESH_INTERVALS.VAULT_DATA,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  const vaults: VaultMetadata[] = YO_VAULTS.map((v) => {
    const stats = data?.[v.address.toLowerCase()]
    return {
      address: v.address,
      name: v.name,
      symbol: v.asset,
      apy: stats?.apy ?? FALLBACK_APY[v.address.toLowerCase()] ?? 0,
      riskLevel: 'Low',
      tvl: stats?.tvl ?? 0n,
      strategy: v.description,
      underlyingAsset: v.assetAddress,
      minDeposit: 0n,
      maxDeposit: BigInt(Number.MAX_SAFE_INTEGER),
      depositFee: 0,
      withdrawalFee: 0,
      performanceFee: 0,
    } satisfies VaultMetadata
  })

  return {
    vaults,
    isLoading,
    error: error ? new Error(error.message ?? 'Failed to fetch vault data') : null,
    refetch: async () => { await mutate() },
  }
}
