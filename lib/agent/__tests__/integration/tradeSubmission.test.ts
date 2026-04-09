/**
 * Integration Test: Trade Submission Flow
 *
 * Tests the full trade submission flow through the service layer:
 * Connect wallet → Fill trade form → Sign intent → Submit trade → Verify submission
 *
 * Requirements: 2.1-2.11
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createTradeIntent, serializeTradeIntent } from '../../tradeIntent'
import { submitTrade, fetchTradeHistory, pollTradeStatus, invalidateTradeHistoryCache } from '../../tradeService'
import { TradeIntent, Trade, TradeSubmitResponse } from '@/types/agent'

const AGENT_ID = 'agent-trade-001'

describe('Integration: Trade Submission Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateTradeHistoryCache(AGENT_ID)
    global.fetch = vi.fn()
  })

  test('full flow: create intent → submit → verify submission', async () => {
    // Step 1: Create and sign trade intent
    const intent = createTradeIntent(
      'ETH/USDC',
      BigInt('1000000000000000000'),
      'buy',
      1700000000,
      '0xsignature123',
      '0xpriceproof123'
    )

    expect(intent.asset).toBe('ETH/USDC')
    expect(intent.amount).toBe(BigInt('1000000000000000000'))
    expect(intent.direction).toBe('buy')

    // Verify intent can be serialized (simulates form → sign step)
    const serialized = serializeTradeIntent(intent)
    expect(serialized).toContain('ETH/USDC')
    expect(serialized).toContain('1000000000000000000')

    // Step 2: Mock trade submission API
    const submitResponse: TradeSubmitResponse = {
      success: true,
      txHash: '0xtrade123',
      tradeId: 'trade-001',
      message: 'Trade submitted',
    }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => submitResponse,
    })

    // Step 3: Submit trade
    const result = await submitTrade(intent, '0xpriceproof123')
    expect(result.success).toBe(true)
    expect(result.txHash).toBe('0xtrade123')
    expect(result.tradeId).toBe('trade-001')

    // Verify correct API call
    expect(global.fetch).toHaveBeenCalledWith('/api/agent/trade', expect.objectContaining({
      method: 'POST',
    }))
  })

  test('full flow: submit trade → poll for confirmation', async () => {
    const intent: TradeIntent = {
      asset: 'BTC/USDC',
      amount: BigInt('50000000'),
      direction: 'sell',
      timestamp: 1700000100,
      signature: '0xsig456',
      priceProof: '0xproof456',
    }

    // Step 1: Submit trade
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, txHash: '0xtrade456', tradeId: 'trade-002' }),
    })

    const submitResult = await submitTrade(intent, '0xproof456')
    expect(submitResult.success).toBe(true)

    // Step 2: Poll — pending first, then confirmed
    const confirmedTrade: Trade = {
      id: 'trade-002',
      timestamp: 1700000100,
      assetPair: 'BTC/USDC',
      amount: BigInt('50000000'),
      direction: 'sell',
      executionPrice: 42000,
      status: 'confirmed',
      txHash: '0xtrade456',
    }
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...confirmedTrade, status: 'pending', amount: '50000000' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...confirmedTrade, amount: '50000000' }),
      })

    const polled = await pollTradeStatus('0xtrade456')
    expect(polled).not.toBeNull()
    expect(polled!.status).toBe('confirmed')
    expect(polled!.id).toBe('trade-002')
  })

  test('full flow: submit trade → fetch trade history', async () => {
    const intent: TradeIntent = {
      asset: 'ETH/USDC',
      amount: BigInt('2000000000000000000'),
      direction: 'buy',
      timestamp: 1700000200,
      signature: '0xsig789',
      priceProof: '0xproof789',
    }

    // Step 1: Submit trade
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, txHash: '0xtrade789', tradeId: 'trade-003' }),
    })

    const submitResult = await submitTrade(intent, '0xproof789')
    expect(submitResult.success).toBe(true)

    // Step 2: Fetch trade history (cache was invalidated by submit)
    const historyTrades = [
      {
        id: 'trade-003',
        timestamp: 1700000200,
        assetPair: 'ETH/USDC',
        amount: '2000000000000000000',
        direction: 'buy',
        executionPrice: 2100,
        status: 'confirmed',
        txHash: '0xtrade789',
      },
    ]
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => historyTrades,
    })

    const history = await fetchTradeHistory(AGENT_ID, 10, 0)
    expect(history).toHaveLength(1)
    expect(history[0].id).toBe('trade-003')
    expect(history[0].amount).toBe(BigInt('2000000000000000000'))
    expect(history[0].status).toBe('confirmed')
  })

  test('trade submission failure returns error response', async () => {
    const intent: TradeIntent = {
      asset: 'ETH/USDC',
      amount: BigInt('1000000000000000000'),
      direction: 'buy',
      timestamp: Date.now(),
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Insufficient balance' }),
    })

    const result = await submitTrade(intent, '0xproof')
    expect(result.success).toBe(false)
    expect(result.message).toContain('Insufficient balance')
  })
})
