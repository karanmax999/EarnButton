/**
 * ERC-8004 Reputation Registry Service
 * 
 * This module provides functions to interact with the ERC-8004 on-chain reputation registry.
 * It handles fetching reputation metrics (Sharpe ratio, drawdown, validation score) and
 * subscribing to real-time updates via polling.
 * 
 * Requirements: 5.1, 5.11, 18.1
 */

import { ReputationMetrics } from '@/types/agent'

/**
 * Fetches reputation metrics for an agent from the ERC-8004 registry
 * 
 * Queries the on-chain reputation registry to retrieve the agent's current metrics:
 * - Sharpe ratio: Risk-adjusted return metric (yield / volatility)
 * - Drawdown percentage: Maximum peak-to-trough decline
 * - Validation score: Percentage of successful validations (0-100)
 * 
 * @param agentId - The unique identifier of the agent
 * @returns Promise resolving to ReputationMetrics or null if fetch fails
 * 
 * @example
 * const metrics = await fetchReputationMetrics('agent-123')
 * if (metrics) {
 *   console.log(`Sharpe ratio: ${metrics.sharpeRatio}`)
 * }
 */
export async function fetchReputationMetrics(
  agentId: string
): Promise<ReputationMetrics | null> {
  try {
    // In a real implementation, this would query the ERC-8004 registry contract
    // For now, we simulate the API call
    const response = await fetch(`/api/agent/reputation?agentId=${agentId}`)
    
    if (!response.ok) {
      console.error(`Failed to fetch reputation metrics: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    
    // Validate response structure
    if (
      typeof data.sharpeRatio !== 'number' ||
      typeof data.drawdownPercentage !== 'number' ||
      typeof data.validationScore !== 'number' ||
      typeof data.updatedAt !== 'number'
    ) {
      console.error('Invalid reputation metrics response structure')
      return null
    }

    return {
      sharpeRatio: data.sharpeRatio,
      drawdownPercentage: data.drawdownPercentage,
      validationScore: data.validationScore,
      updatedAt: data.updatedAt,
    }
  } catch (error) {
    console.error('Error fetching reputation metrics:', error)
    return null
  }
}

/**
 * Subscribes to reputation updates via polling at 30-second intervals
 * 
 * Polls the ERC-8004 registry every 30 seconds to fetch updated reputation metrics
 * and invoke the callback with new data. Returns an unsubscribe function to stop polling.
 * 
 * @param agentId - The unique identifier of the agent
 * @param callback - Function called with updated metrics on each poll
 * @returns Function to unsubscribe and stop polling
 * 
 * @example
 * const unsubscribe = subscribeToReputationUpdates('agent-123', (metrics) => {
 *   console.log(`Updated Sharpe ratio: ${metrics.sharpeRatio}`)
 * })
 * 
 * // Later, stop polling
 * unsubscribe()
 */
export function subscribeToReputationUpdates(
  agentId: string,
  callback: (metrics: ReputationMetrics) => void
): () => void {
  // Poll every 30 seconds
  const POLL_INTERVAL = 30000

  const intervalId = setInterval(async () => {
    const metrics = await fetchReputationMetrics(agentId)
    if (metrics) {
      callback(metrics)
    }
  }, POLL_INTERVAL)

  // Return unsubscribe function
  return () => {
    clearInterval(intervalId)
  }
}
