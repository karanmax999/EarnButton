/**
 * Credora Risk Rating Service
 * 
 * This module provides functions to interact with the Credora API for risk ratings.
 * It handles fetching risk ratings for vaults and subscribing to real-time updates via polling.
 * Risk levels are mapped to color codes for visual display.
 * 
 * Requirements: 3.1, 3.8, 18.4, 15.4-15.5
 */

import { RiskRating } from '@/types/agent'

// 60-second TTL cache for risk ratings (keyed by sorted vault addresses)
const RISK_CACHE_TTL = 60000
interface CacheEntry<T> { data: T; timestamp: number }
const riskRatingsCache = new Map<string, CacheEntry<RiskRating[]>>()

/**
 * Maps risk level to color code for UI display
 * 
 * @param riskLevel - The risk level ('low', 'medium', 'high')
 * @returns Color code string (e.g., 'green', 'amber', 'red')
 */
function mapRiskLevelToColor(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low':
      return 'green'
    case 'medium':
      return 'amber'
    case 'high':
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * Fetches risk ratings for multiple vaults from Credora API
 * 
 * Queries the Credora API to retrieve risk assessments for the specified vaults.
 * Each rating includes position limits, maximum leverage, and daily loss limits.
 * Risk levels are mapped to color codes for visual display.
 * 
 * @param vaultAddresses - Array of Ethereum vault addresses to fetch ratings for
 * @returns Promise resolving to array of RiskRating objects or null if fetch fails
 * 
 * @example
 * const ratings = await fetchRiskRatings(['0x123...', '0x456...'])
 * if (ratings) {
 *   ratings.forEach(rating => {
 *     console.log(`${rating.vaultName}: ${rating.riskLevel}`)
 *   })
 * }
 */
export async function fetchRiskRatings(
  vaultAddresses: string[]
): Promise<RiskRating[] | null> {
  try {
    if (!vaultAddresses || vaultAddresses.length === 0) {
      return []
    }

    // Cache key: sorted vault addresses joined
    const cacheKey = [...vaultAddresses].sort().join(',')
    const cached = riskRatingsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < RISK_CACHE_TTL) {
      return cached.data
    }

    // In a real implementation, this would call the Credora API
    // For now, we simulate the API call
    const response = await fetch('/api/agent/risk-ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vaultAddresses }),
    })

    if (!response.ok) {
      console.error(`Failed to fetch risk ratings: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Validate response is an array
    if (!Array.isArray(data)) {
      console.error('Invalid risk ratings response: expected array')
      return null
    }

    // Validate and transform each rating
    const ratings: RiskRating[] = data.map((item: any) => {
      if (
        typeof item.vaultAddress !== 'string' ||
        typeof item.vaultName !== 'string' ||
        (typeof item.positionLimit !== 'bigint' && typeof item.positionLimit !== 'number' && typeof item.positionLimit !== 'string') ||
        typeof item.maxLeverage !== 'number' ||
        (typeof item.dailyLossLimit !== 'bigint' && typeof item.dailyLossLimit !== 'number' && typeof item.dailyLossLimit !== 'string') ||
        !['low', 'medium', 'high'].includes(item.riskLevel) ||
        typeof item.updatedAt !== 'number'
      ) {
        throw new Error('Invalid risk rating structure')
      }

      return {
        vaultAddress: item.vaultAddress,
        vaultName: item.vaultName,
        positionLimit: typeof item.positionLimit === 'bigint' ? item.positionLimit : BigInt(item.positionLimit),
        maxLeverage: item.maxLeverage,
        dailyLossLimit: typeof item.dailyLossLimit === 'bigint' ? item.dailyLossLimit : BigInt(item.dailyLossLimit),
        riskLevel: item.riskLevel,
        updatedAt: item.updatedAt,
      }
    })

    // Store in TTL cache
    riskRatingsCache.set(cacheKey, { data: ratings, timestamp: Date.now() })

    return ratings
  } catch (error) {
    console.error('Error fetching risk ratings:', error)
    return null
  }
}

/**
 * Clears the risk ratings cache. Useful for testing.
 */
export function clearRiskRatingsCache(cacheKey?: string): void {
  if (cacheKey) {
    riskRatingsCache.delete(cacheKey)
  } else {
    riskRatingsCache.clear()
  }
}

/**
 * Subscribes to risk rating updates via polling at 60-second intervals
 * 
 * Polls the Credora API every 60 seconds to fetch updated risk ratings
 * and invoke the callback with new data. Returns an unsubscribe function to stop polling.
 * 
 * @param vaultAddresses - Array of Ethereum vault addresses to monitor
 * @param callback - Function called with updated ratings on each poll
 * @returns Function to unsubscribe and stop polling
 * 
 * @example
 * const unsubscribe = subscribeToRiskUpdates(['0x123...'], (ratings) => {
 *   ratings.forEach(rating => {
 *     console.log(`${rating.vaultName}: ${mapRiskLevelToColor(rating.riskLevel)}`)
 *   })
 * })
 * 
 * // Later, stop polling
 * unsubscribe()
 */
export function subscribeToRiskUpdates(
  vaultAddresses: string[],
  callback: (ratings: RiskRating[]) => void
): () => void {
  // Poll every 60 seconds
  const POLL_INTERVAL = 60000

  const intervalId = setInterval(async () => {
    const ratings = await fetchRiskRatings(vaultAddresses)
    if (ratings) {
      callback(ratings)
    }
  }, POLL_INTERVAL)

  // Return unsubscribe function
  return () => {
    clearInterval(intervalId)
  }
}

/**
 * Exports the color mapping function for use in components
 */
export { mapRiskLevelToColor }
