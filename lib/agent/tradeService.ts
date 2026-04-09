/**
 * Trade Service
 * 
 * This module provides functions to interact with trade submission and history management.
 * It handles submitting signed trade intents, fetching trade history, and polling for trade confirmation.
 * 
 * Requirements: 2.7, 7.1, 11.2
 */

import { TradeIntent, Trade, TradeSubmitResponse } from '@/types/agent'

/**
 * Submits a signed trade intent to the trading system
 * 
 * Sends a complete trade intent with EIP-712 signature and RedStone price proof to the backend API.
 * The backend will validate the signature, verify the price proof, and execute the trade on-chain.
 * 
 * @param intent - The TradeIntent object with asset, amount, direction, and timestamp
 * @param priceProof - RedStone price proof string to attach to the trade
 * @returns Promise resolving to TradeSubmitResponse with txHash and tradeId
 * 
 * @example
 * const intent: TradeIntent = {
 *   asset: 'ETH/USDC',
 *   amount: BigInt('1000000000000000000'),
 *   direction: 'buy',
 *   timestamp: Date.now(),
 *   signature: '0x...',
 *   priceProof: '0x...'
 * }
 * const response = await submitTrade(intent, priceProof)
 * if (response.success) {
 *   console.log(`Trade submitted: ${response.tradeId}`)
 * }
 */
export async function submitTrade(
  intent: TradeIntent,
  priceProof: string
): Promise<TradeSubmitResponse> {
  try {
    if (!intent) {
      throw new Error('Invalid trade intent')
    }

    if (!priceProof || typeof priceProof !== 'string') {
      throw new Error('Invalid price proof')
    }

    // Validate intent structure
    if (
      typeof intent.asset !== 'string' ||
      (typeof intent.amount !== 'bigint' && typeof intent.amount !== 'number' && typeof intent.amount !== 'string') ||
      !['buy', 'sell'].includes(intent.direction) ||
      typeof intent.timestamp !== 'number'
    ) {
      throw new Error('Invalid trade intent structure')
    }

    const response = await fetch('/api/agent/trade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: {
          asset: intent.asset,
          amount: intent.amount.toString(),
          direction: intent.direction,
          timestamp: intent.timestamp,
          signature: intent.signature,
          priceProof: intent.priceProof,
        },
        priceProof,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to submit trade')
    }

    const data = await response.json()

    // Validate response structure
    if (
      typeof data.success !== 'boolean' ||
      typeof data.txHash !== 'string' ||
      typeof data.tradeId !== 'string'
    ) {
      throw new Error('Invalid trade submission response structure')
    }

    return {
      success: data.success,
      txHash: data.txHash,
      tradeId: data.tradeId,
      message: data.message,
    }
  } catch (error) {
    console.error('Error submitting trade:', error)
    return {
      success: false,
      txHash: '',
      tradeId: '',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetches trade history for an agent
 * 
 * Retrieves a paginated list of trades executed by the agent, sorted by timestamp (newest first).
 * Each trade includes execution details like price, gas used, and slippage.
 * 
 * @param agentId - The unique identifier of the agent
 * @param limit - Maximum number of trades to return (default: 10)
 * @param offset - Number of trades to skip for pagination (default: 0)
 * @returns Promise resolving to array of Trade objects
 * 
 * @example
 * const trades = await fetchTradeHistory('agent-123', 10, 0)
 * trades.forEach(trade => {
 *   console.log(`${trade.assetPair}: ${trade.direction} ${trade.amount}`)
 * })
 */
export async function fetchTradeHistory(
  agentId: string,
  limit: number = 10,
  offset: number = 0
): Promise<Trade[]> {
  try {
    if (!agentId || typeof agentId !== 'string') {
      console.error('Invalid agent ID')
      return []
    }

    if (typeof limit !== 'number' || limit < 1) {
      console.error('Invalid limit')
      return []
    }

    if (typeof offset !== 'number' || offset < 0) {
      console.error('Invalid offset')
      return []
    }

    const params = new URLSearchParams({
      agentId,
      limit: limit.toString(),
      offset: offset.toString(),
    })

    const response = await fetch(`/api/agent/trade-history?${params}`)

    if (!response.ok) {
      console.error(`Failed to fetch trade history: ${response.statusText}`)
      return []
    }

    const data = await response.json()

    // Validate response is an array
    if (!Array.isArray(data)) {
      console.error('Invalid trade history response: expected array')
      return []
    }

    // Validate and transform each trade
    const trades: Trade[] = data.map((item: any) => {
      if (
        typeof item.id !== 'string' ||
        typeof item.timestamp !== 'number' ||
        typeof item.assetPair !== 'string' ||
        (typeof item.amount !== 'bigint' && typeof item.amount !== 'number' && typeof item.amount !== 'string') ||
        !['buy', 'sell'].includes(item.direction) ||
        typeof item.executionPrice !== 'number' ||
        !['pending', 'confirmed', 'failed'].includes(item.status)
      ) {
        throw new Error('Invalid trade structure')
      }

      return {
        id: item.id,
        timestamp: item.timestamp,
        assetPair: item.assetPair,
        amount: typeof item.amount === 'bigint' ? item.amount : BigInt(item.amount),
        direction: item.direction,
        executionPrice: item.executionPrice,
        status: item.status,
        txHash: item.txHash,
        gasUsed: item.gasUsed ? (typeof item.gasUsed === 'bigint' ? item.gasUsed : BigInt(item.gasUsed)) : undefined,
        slippage: item.slippage,
        validationArtifacts: item.validationArtifacts,
      }
    })

    return trades
  } catch (error) {
    console.error('Error fetching trade history:', error)
    return []
  }
}

/**
 * Polls for trade status confirmation
 * 
 * Repeatedly queries the blockchain to check if a trade transaction has been confirmed.
 * Polls every 2 seconds until the trade is confirmed or timeout is reached (60 seconds).
 * 
 * @param txHash - Transaction hash to poll for confirmation
 * @returns Promise resolving to Trade object when confirmed, or null if timeout
 * 
 * @example
 * const trade = await pollTradeStatus('0x123...')
 * if (trade) {
 *   console.log(`Trade confirmed: ${trade.id}`)
 * } else {
 *   console.log('Trade confirmation timed out')
 * }
 */
export async function pollTradeStatus(txHash: string): Promise<Trade | null> {
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
            `/api/agent/trade-status?txHash=${encodeURIComponent(txHash)}`
          )

          if (response.ok) {
            const data = await response.json()

            // Validate trade structure
            if (
              typeof data.id === 'string' &&
              typeof data.timestamp === 'number' &&
              typeof data.assetPair === 'string' &&
              typeof data.executionPrice === 'number' &&
              ['pending', 'confirmed', 'failed'].includes(data.status)
            ) {
              const trade: Trade = {
                id: data.id,
                timestamp: data.timestamp,
                assetPair: data.assetPair,
                amount: typeof data.amount === 'bigint' ? data.amount : BigInt(data.amount),
                direction: data.direction,
                executionPrice: data.executionPrice,
                status: data.status,
                txHash: data.txHash,
                gasUsed: data.gasUsed ? (typeof data.gasUsed === 'bigint' ? data.gasUsed : BigInt(data.gasUsed)) : undefined,
                slippage: data.slippage,
                validationArtifacts: data.validationArtifacts,
              }

              if (data.status === 'confirmed' || data.status === 'failed') {
                clearInterval(intervalId)
                resolve(trade)
                return
              }
            }
          }
        } catch (error) {
          console.error('Error polling trade status:', error)
        }

        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(intervalId)
          resolve(null)
          return
        }
      }, POLL_INTERVAL)
    })
  } catch (error) {
    console.error('Error in pollTradeStatus:', error)
    return null
  }
}
