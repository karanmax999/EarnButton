/**
 * Agent Service
 * 
 * This module provides functions to interact with agent registration and identity management.
 * It handles registering agents with ERC-721 identity NFTs, fetching agent identity from the blockchain,
 * and polling for registration confirmation.
 * 
 * Requirements: 1.2, 1.3, 1.4, 1.8, 11.1
 */

import { AgentIdentity, AgentRegisterResponse } from '@/types/agent'

/**
 * Registers a new agent with an ERC-721 identity NFT
 * 
 * Submits an agent registration request to the backend API, which will:
 * 1. Create an ERC-721 token representing the agent's identity
 * 2. Store the agent metadata on-chain
 * 3. Return a transaction hash for tracking
 * 
 * @param name - Human-readable name for the agent
 * @param walletAddress - Ethereum address of the agent's wallet
 * @returns Promise resolving to AgentRegisterResponse with agentId and txHash
 * 
 * @example
 * const response = await registerAgent('My Trading Agent', '0x123...')
 * if (response.success) {
 *   console.log(`Agent registered with ID: ${response.agentId}`)
 *   console.log(`Transaction: ${response.txHash}`)
 * }
 */
export async function registerAgent(
  name: string,
  walletAddress: string
): Promise<AgentRegisterResponse> {
  try {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid agent name')
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Invalid wallet address')
    }

    const response = await fetch('/api/agent/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        walletAddress,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to register agent')
    }

    const data = await response.json()

    // Validate response structure
    if (
      typeof data.success !== 'boolean' ||
      typeof data.agentId !== 'string' ||
      typeof data.txHash !== 'string'
    ) {
      throw new Error('Invalid registration response structure')
    }

    return {
      success: data.success,
      agentId: data.agentId,
      txHash: data.txHash,
      message: data.message,
    }
  } catch (error) {
    console.error('Error registering agent:', error)
    return {
      success: false,
      agentId: '',
      txHash: '',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetches agent identity from the blockchain
 * 
 * Queries the blockchain to retrieve the agent's ERC-721 token and associated metadata.
 * Returns null if no agent identity is found for the wallet address.
 * 
 * @param walletAddress - Ethereum address to query for agent identity
 * @returns Promise resolving to AgentIdentity or null if not found
 * 
 * @example
 * const agent = await fetchAgentIdentity('0x123...')
 * if (agent) {
 *   console.log(`Agent: ${agent.name} (ID: ${agent.id})`)
 * } else {
 *   console.log('No agent registered for this wallet')
 * }
 */
export async function fetchAgentIdentity(
  walletAddress: string
): Promise<AgentIdentity | null> {
  try {
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.error('Invalid wallet address')
      return null
    }

    const response = await fetch(
      `/api/agent/identity?walletAddress=${encodeURIComponent(walletAddress)}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        // No agent found for this wallet
        return null
      }
      console.error(`Failed to fetch agent identity: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Validate response structure
    if (
      typeof data.id !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.walletAddress !== 'string' ||
      (typeof data.tokenId !== 'bigint' && typeof data.tokenId !== 'number' && typeof data.tokenId !== 'string') ||
      !Array.isArray(data.capabilities) ||
      typeof data.registeredAt !== 'number' ||
      !['pending', 'live'].includes(data.status)
    ) {
      console.error('Invalid agent identity response structure')
      return null
    }

    return {
      id: data.id,
      name: data.name,
      walletAddress: data.walletAddress,
      tokenId: typeof data.tokenId === 'bigint' ? data.tokenId : BigInt(data.tokenId),
      capabilities: data.capabilities,
      registeredAt: data.registeredAt,
      status: data.status,
    }
  } catch (error) {
    console.error('Error fetching agent identity:', error)
    return null
  }
}

/**
 * Polls for agent registration confirmation
 * 
 * Repeatedly queries the blockchain to check if an agent registration transaction has been confirmed.
 * Polls every 2 seconds until the agent identity is found or timeout is reached (60 seconds).
 * 
 * @param walletAddress - Ethereum address to poll for agent identity
 * @returns Promise resolving to AgentIdentity when confirmed, or null if timeout
 * 
 * @example
 * const agent = await pollAgentRegistration('0x123...')
 * if (agent) {
 *   console.log(`Agent registration confirmed: ${agent.id}`)
 * } else {
 *   console.log('Registration confirmation timed out')
 * }
 */
export async function pollAgentRegistration(
  walletAddress: string
): Promise<AgentIdentity | null> {
  if (!walletAddress || typeof walletAddress !== 'string') {
    return null
  }

  const POLL_INTERVAL = 2000 // 2 seconds
  const MAX_ATTEMPTS = 30 // 60 seconds total
  let attempts = 0

  return new Promise((resolve) => {
    const intervalId = setInterval(async () => {
      attempts++

      const agent = await fetchAgentIdentity(walletAddress)

      if (agent) {
        clearInterval(intervalId)
        resolve(agent)
        return
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId)
        resolve(null)
        return
      }
    }, POLL_INTERVAL)
  })
}
