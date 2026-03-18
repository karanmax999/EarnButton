import useSWR from 'swr'
import { YO_VAULTS, REFRESH_INTERVALS } from '../constants'

// Fallback APYs from YO Protocol marketing (used if API fails)
const FALLBACK_APY: Record<string, number> = {
  [YO_VAULTS[0].address.toLowerCase()]: 8.5,  // yoUSD
  [YO_VAULTS[1].address.toLowerCase()]: 6.2,  // yoETH
  [YO_VAULTS[2].address.toLowerCase()]: 5.8,  // yoBTC
  [YO_VAULTS[3].address.toLowerCase()]: 7.1,  // yoEUR
}

// Fallback allocations per vault (shown when API returns no data)
export const FALLBACK_ALLOCATIONS: Record<string, Array<{ protocol: string; percentage: number }>> = {
  [YO_VAULTS[0].address.toLowerCase()]: [
    { protocol: 'Morpho', percentage: 45 },
    { protocol: 'Aave', percentage: 35 },
    { protocol: 'Auto', percentage: 20 },
  ],
  [YO_VAULTS[1].address.toLowerCase()]: [
    { protocol: 'Aave', percentage: 60 },
    { protocol: 'Morpho', percentage: 40 },
  ],
  [YO_VAULTS[2].address.toLowerCase()]: [
    { protocol: 'Aave', percentage: 70 },
    { protocol: 'Morpho', percentage: 30 },
  ],
  [YO_VAULTS[3].address.toLowerCase()]: [
    { protocol: 'Aave', percentage: 80 },
    { protocol: 'Morpho', percentage: 20 },
  ],
}

export interface VaultAPYData {
  apy: number
  tvlFormatted: string
  sharePrice: number
  allocations: Array<{ protocol: string; pool: string; percentage: number; yield1d: number }>
}

async function fetchVaultData(address: string): Promise<VaultAPYData> {
  const res = await fetch(`https://api.yo.xyz/api/v1/vault/base/${address}`)
  if (!res.ok) throw new Error(`API ${res.status}`)
  const json = await res.json()
  const stats = json?.data?.stats
  if (!stats) throw new Error('No stats in response')

  const apy = parseFloat(stats.yield?.['30d'] ?? stats.yield?.['7d'] ?? stats.yield?.['1d'] ?? '0')
  const tvlFormatted = stats.tvl?.formatted ?? '0'
  // sharePrice: how many underlying asset units one share is worth (e.g. 1.071472 means 7.1% yield accrued)
  // The API returns sharePrice as { raw: number, formatted: string } — use formatted for human-readable float
  const sharePriceRaw = stats.sharePrice ?? stats.pricePerShare ?? stats.nav
  const sharePrice =
    (typeof sharePriceRaw === 'object' && sharePriceRaw !== null
      ? parseFloat(sharePriceRaw.formatted ?? sharePriceRaw.raw ?? '1')
      : parseFloat(sharePriceRaw ?? '1')) || 1

  // Build allocations from protocolStats — only include pools with non-zero allocation
  const allocations = (stats.protocolStats ?? [])
    .filter((p: { allocation: { raw: string } }) => parseFloat(p.allocation?.raw ?? '0') > 0)
    .map((p: { protocol: string; pool: string; allocation: { raw: string }; yield: { '1d': string } }) => ({
      protocol: p.protocol,
      pool: p.pool,
      percentage: parseFloat(p.allocation?.raw ?? '0'),
      yield1d: parseFloat(p.yield?.['1d'] ?? '0'),
    }))
    .sort((a: { percentage: number }, b: { percentage: number }) => b.percentage - a.percentage)

  return { apy, tvlFormatted, sharePrice, allocations }
}

/**
 * Fetches APY + allocation data for a single vault from the YO Protocol API.
 * Falls back to hardcoded values if the fetch fails.
 * Cached with SWR, revalidates every 5 minutes. No wallet connection required.
 */
export function useVaultAPY(vaultAddress: string): {
  apy: number
  tvlFormatted: string
  sharePrice: number
  allocations: Array<{ protocol: string; pool: string; percentage: number; yield1d: number }>
  isLoading: boolean
} {
  const key = vaultAddress ? `vault-apy-${vaultAddress.toLowerCase()}` : null

  const { data, isLoading } = useSWR(key, () => fetchVaultData(vaultAddress), {
    refreshInterval: REFRESH_INTERVALS.VAULT_DATA,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    fallbackData: undefined,
  })

  const fallbackApy = FALLBACK_APY[vaultAddress.toLowerCase()] ?? 0
  const fallbackAllocs = (FALLBACK_ALLOCATIONS[vaultAddress.toLowerCase()] ?? []).map((a) => ({
    ...a,
    pool: a.protocol,
    yield1d: 0,
  }))

  return {
    apy: data?.apy ?? fallbackApy,
    tvlFormatted: data?.tvlFormatted ?? '0',
    sharePrice: data?.sharePrice ?? 1,
    allocations: data?.allocations?.length ? data.allocations : fallbackAllocs,
    isLoading,
  }
}
