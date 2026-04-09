/**
 * Trade Service Tests
 * 
 * Tests for trade submission, history fetching, and trade status polling.
 * Validates Requirements: 2.7, 7.1, 11.2
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  submitTrade,
  fetchTradeHistory,
  pollTradeStatus,
} from '../tradeService'
import { TradeIntent, Trade } from '@/types/agent'

describe('tradeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('submitTrade', () => {
    test('should successfully submit a trade', async () => {
      const intent: TradeIntent = {
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy',
        timestamp: Date.now(),
        signature: '0xsig123',
        priceProof: '0xproof123',
      }

      const mockResponse = {
        success: true,
        txHash: '0x123abc',
        tradeId: 'trade-123',
        message: 'Trade submitted successfully',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await submitTrade(intent, '0xproof123')

      expect(result.success).toBe(true)
      expect(result.txHash).toBe('0x123abc')
      expect(result.tradeId).toBe('trade-123')
    })

    test('should handle trade submission failure', async () => {
      const intent: TradeIntent = {
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy',
        timestamp: Date.now(),
      }

      const mockError = {
        message: 'Insufficient balance',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      })

      const result = await submitTrade(intent, '0xproof123')

      expect(result.success).toBe(false)
    })

    test('should reject invalid trade intent', async () => {
      const result = await submitTrade(null as any, '0xproof123')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid trade intent')
    })

    test('should reject invalid price proof', async () => {
      const intent: TradeIntent = {
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy',
        timestamp: Date.now(),
      }

      const result = await submitTrade(intent, '')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid price proof')
    })

    test('should handle network errors', async () => {
      const intent: TradeIntent = {
        asset: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy',
        timestamp: Date.now(),
      }

      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await submitTrade(intent, '0xproof123')

      expect(result.success).toBe(false)
    })
  })

  describe('fetchTradeHistory', () => {
    test('should fetch trade history successfully', async () => {
      const mockTrades: Trade[] = [
        {
          id: 'trade-1',
          timestamp: 1234567890,
          assetPair: 'ETH/USDC',
          amount: BigInt('1000000000000000000'),
          direction: 'buy',
          executionPrice: 2000,
          status: 'confirmed',
          txHash: '0x123',
        },
        {
          id: 'trade-2',
          timestamp: 1234567880,
          assetPair: 'BTC/USDC',
          amount: BigInt('500000000000000000'),
          direction: 'sell',
          executionPrice: 40000,
          status: 'confirmed',
          txHash: '0x456',
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrades,
      })

      const result = await fetchTradeHistory('agent-123', 10, 0)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('trade-1')
      expect(result[0].amount).toBe(BigInt('1000000000000000000'))
    })

    test('should return empty array when no trades found', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const result = await fetchTradeHistory('agent-123', 10, 0)

      expect(result).toEqual([])
    })

    test('should handle invalid agent ID', async () => {
      const result = await fetchTradeHistory('', 10, 0)

      expect(result).toEqual([])
    })

    test('should handle invalid limit', async () => {
      const result = await fetchTradeHistory('agent-123', 0, 0)

      expect(result).toEqual([])
    })

    test('should handle invalid offset', async () => {
      const result = await fetchTradeHistory('agent-123', 10, -1)

      expect(result).toEqual([])
    })

    test('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchTradeHistory('agent-123', 10, 0)

      expect(result).toEqual([])
    })

    test('should convert amount from string to bigint', async () => {
      const mockTrades = [
        {
          id: 'trade-1',
          timestamp: 1234567890,
          assetPair: 'ETH/USDC',
          amount: '1000000000000000000',
          direction: 'buy',
          executionPrice: 2000,
          status: 'confirmed',
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrades,
      })

      const result = await fetchTradeHistory('agent-123', 10, 0)

      expect(result[0].amount).toBe(BigInt('1000000000000000000'))
    })

    test('should validate response structure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'trade-1',
            // Missing required fields
          },
        ],
      })

      const result = await fetchTradeHistory('agent-123', 10, 0)

      expect(result).toEqual([])
    })
  })

  describe('pollTradeStatus', () => {
    test('should poll until trade is confirmed', async () => {
      const mockTrade: Trade = {
        id: 'trade-123',
        timestamp: 1234567890,
        assetPair: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy',
        executionPrice: 2000,
        status: 'confirmed',
        txHash: '0x123abc',
      }

      // First call returns pending, second call returns confirmed
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockTrade,
            status: 'pending',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrade,
        })

      const result = await pollTradeStatus('0x123abc')

      expect(result?.status).toBe('confirmed')
      expect(result?.id).toBe('trade-123')
    })

    test('should handle trade failure status', async () => {
      const mockTrade: Trade = {
        id: 'trade-123',
        timestamp: 1234567890,
        assetPair: 'ETH/USDC',
        amount: BigInt('1000000000000000000'),
        direction: 'buy',
        executionPrice: 2000,
        status: 'failed',
        txHash: '0x123abc',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrade,
      })

      const result = await pollTradeStatus('0x123abc')

      expect(result?.status).toBe('failed')
    })

    test('should handle invalid transaction hash', async () => {
      const result = await pollTradeStatus('')

      expect(result).toBeNull()
    })
  })
})
