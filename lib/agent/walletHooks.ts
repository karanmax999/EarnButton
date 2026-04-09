/**
 * Wallet Integration Hooks
 * 
 * Custom React hooks for wallet integration with the agent dashboard.
 * Provides access to wallet state, agent data, and wallet connection guards.
 */

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { AgentIdentity } from '@/types/agent'
import { fetchAgentIdentity } from './agentService'

/**
 * useAgentWallet Hook
 * 
 * Provides access to the connected wallet state and address.
 * 
 * @returns {Object} Wallet state object
 * @returns {string | undefined} address - Connected wallet address
 * @returns {boolean} isConnected - Whether wallet is connected
 * @returns {boolean} isConnecting - Whether wallet is connecting
 * @returns {boolean} isDisconnected - Whether wallet is disconnected
 * 
 * @example
 * const { address, isConnected } = useAgentWallet()
 */
export function useAgentWallet() {
  const { address, isConnected, isConnecting, isDisconnected, status } =
    useAccount()

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    status,
  }
}

/**
 * useAgentData Hook
 * 
 * Fetches and caches agent data for the connected wallet.
 * Automatically refetches when wallet address changes.
 * 
 * @param {string | undefined} walletAddress - Wallet address to fetch data for
 * @returns {Object} Agent data state
 * @returns {AgentIdentity | null} data - Agent identity data
 * @returns {boolean} loading - Whether data is loading
 * @returns {Error | null} error - Error if fetch failed
 * @returns {() => Promise<void>} refetch - Function to manually refetch data
 * 
 * @example
 * const { data, loading, error, refetch } = useAgentData(walletAddress)
 */
export function useAgentData(walletAddress: string | undefined) {
  const [data, setData] = useState<AgentIdentity | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = async () => {
    if (!walletAddress) {
      setData(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const agentData = await fetchAgentIdentity(walletAddress)
      setData(agentData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agent data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, [walletAddress])

  return { data, loading, error, refetch }
}

/**
 * useWalletGuard Hook
 * 
 * Checks if wallet is connected and provides connection status.
 * Useful for components that require wallet connection.
 * 
 * @returns {Object} Wallet guard state
 * @returns {boolean} isConnected - Whether wallet is connected
 * @returns {string | undefined} address - Connected wallet address
 * @returns {boolean} isReady - Whether wallet is ready to use
 * 
 * @example
 * const { isConnected, address, isReady } = useWalletGuard()
 * if (!isReady) return <ConnectWalletPrompt />
 */
export function useWalletGuard() {
  const { address, isConnected, status } = useAccount()
  const isReady = isConnected && address !== undefined && status === 'connected'

  return {
    isConnected,
    address,
    isReady,
  }
}

/**
 * useAgentDataCache Hook
 * 
 * Provides caching for agent data with configurable TTL.
 * Reduces redundant API calls for frequently accessed data.
 * 
 * @param {string | undefined} walletAddress - Wallet address to cache data for
 * @param {number} ttl - Time to live in milliseconds (default: 30000 = 30 seconds)
 * @returns {Object} Cached agent data state
 * @returns {AgentIdentity | null} data - Cached agent identity data
 * @returns {boolean} loading - Whether data is loading
 * @returns {Error | null} error - Error if fetch failed
 * @returns {() => Promise<void>} refetch - Function to manually refetch data
 * 
 * @example
 * const { data, loading, error, refetch } = useAgentDataCache(walletAddress, 60000)
 */
export function useAgentDataCache(
  walletAddress: string | undefined,
  ttl: number = 30000
) {
  const [data, setData] = useState<AgentIdentity | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const refetch = async (force: boolean = false) => {
    if (!walletAddress) {
      setData(null)
      return
    }

    const now = Date.now()
    const isCacheValid = now - lastFetchTime < ttl

    if (isCacheValid && !force) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const agentData = await fetchAgentIdentity(walletAddress)
      setData(agentData)
      setLastFetchTime(now)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agent data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, [walletAddress])

  return { data, loading, error, refetch }
}
