/**
 * Sandbox Service
 * 
 * This module provides functions to interact with the capital sandbox vault.
 * It handles fetching sandbox balance and claim status, submitting capital claims,
 * and polling for claim confirmation.
 * 
 * Requirements: 6.1-6.7, 11.1
 */

import { CapitalSandbox } from '@/types/agent'

/**
 * Fetches sandbox vault balance and claim status
 * 
 * Queries the sandbox vault contract to retrieve the agent's current balance,
 * capital claimed status, and ETH allocation for gas fees.
 * 
 * @param walletAddress - Ethereum address to query sandbox balance for
 * @returns Promise resolving to CapitalSandbox object or null if fetch fails
 * 
 * @example
 * const sandbox = await fetchSandboxBalance('0x123...')
 * if (sandbox) {
 *   console.log(`Balance: ${sandbox.balance} USDC`)
 *   console.log(`Claimed: ${sandbox.claimed}`)
 *   console.log(`ETH Allocation: ${sandbox.ethAllocation}`)
 * }
 */
export async function fetchSandboxBalance(
  walletAddress: string
): Promise<CapitalSandbox | null> {
  try {
    if (!walletAddress || typeof walletAddress !== 'string') {
      console.error('Invalid wallet address')
      return null
    }

    const response = await fetch(
      `/api/agent/sandbox-balance?walletAddress=${encodeURIComponent(walletAddress)}`
    )

    if (!response.ok) {
      console.error(`Failed to fetch sandbox balance: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Validate response structure
    if (
      typeof data.vaultAddress !== 'string' ||
      (typeof data.balance !== 'bigint' && typeof data.balance !== 'number' && typeof data.balance !== 'string') ||
      typeof data.claimed !== 'boolean' ||
      (typeof data.ethAllocation !== 'bigint' && typeof data.ethAllocation !== 'number' && typeof data.ethAllocation !== 'string')
    ) {
      console.error('Invalid sandbox balance response structure')
      return null
    }

    return {
      vaultAddress: data.vaultAddress,
      balance: typeof data.balance === 'bigint' ? data.balance : BigInt(data.balance),
      claimed: data.claimed,
      ethAllocation: typeof data.ethAllocation === 'bigint' ? data.ethAllocation : BigInt(data.ethAllocation),
    }
  } catch (error) {
    console.error('Error fetching sandbox balance:', error)
    return null
  }
}

/**
 * Submits a capital claim transaction to the sandbox vault
 * 
 * Initiates a transaction to claim allocated capital from the sandbox vault.
 * The transaction must be signed by the wallet owner and will transfer the claimed
 * capital to the agent's wallet.
 * 
 * @param walletAddress - Ethereum address submitting the claim
 * @returns Promise resolving to transaction hash or null if submission fails
 * 
 * @example
 * const txHash = await claimCapital('0x123...')
 * if (txHash) {
 *   console.log(`Claim submitted: ${txHash}`)
 *   const sandbox = await pollClaimStatus(txHash)
 * }
 */
export async function claimCapital(walletAddress: string): Promise<string | null> {
  try {
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Invalid wallet address')
    }

    const response = await fetch('/api/agent/claim-capital', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to submit capital claim')
    }

    const data = await response.json()

    // Validate response structure
    if (typeof data.txHash !== 'string') {
      throw new Error('Invalid claim response structure')
    }

    return data.txHash
  } catch (error) {
    console.error('Error claiming capital:', error)
    return null
  }
}

/**
 * Polls for capital claim confirmation
 * 
 * Repeatedly queries the blockchain to check if a capital claim transaction has been confirmed.
 * Polls every 2 seconds until the claim is confirmed or timeout is reached (60 seconds).
 * 
 * @param txHash - Transaction hash to poll for confirmation
 * @returns Promise resolving to CapitalSandbox when confirmed, or null if timeout
 * 
 * @example
 * const sandbox = await pollClaimStatus('0x123...')
 * if (sandbox) {
 *   console.log(`Capital claim confirmed: ${sandbox.balance}`)
 * } else {
 *   console.log('Claim confirmation timed out')
 * }
 */
export async function pollClaimStatus(txHash: string): Promise<CapitalSandbox | null> {
  try {
    if (!txHash || typeof txHash !== 'string') {
      console.error('Invalid transaction hash')
      return null
    }

    const POLL_INTERVAL = 2000 // 2 seconds
    const MAX_ATTEMPTS = 30 // 60 seconds total
    let attempts = 0

    return new Promise((resolve) => {
      const intervalId = setInterval(async () => {
        attempts++

        try {
          const response = await fetch(
            `/api/agent/claim-status?txHash=${encodeURIComponent(txHash)}`
          )

          if (response.ok) {
            const data = await response.json()

            // Validate sandbox structure
            if (
              typeof data.vaultAddress === 'string' &&
              typeof data.claimed === 'boolean'
            ) {
              const sandbox: CapitalSandbox = {
                vaultAddress: data.vaultAddress,
                balance: typeof data.balance === 'bigint' ? data.balance : BigInt(data.balance),
                claimed: data.claimed,
                ethAllocation: typeof data.ethAllocation === 'bigint' ? data.ethAllocation : BigInt(data.ethAllocation),
              }

              // If claim is confirmed, resolve
              if (sandbox.claimed) {
                clearInterval(intervalId)
                resolve(sandbox)
                return
              }
            }
          }
        } catch (error) {
          console.error('Error polling claim status:', error)
        }

        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(intervalId)
          resolve(null)
          return
        }
      }, POLL_INTERVAL)
    })
  } catch (error) {
    console.error('Error in pollClaimStatus:', error)
    return null
  }
}
