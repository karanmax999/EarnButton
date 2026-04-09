/**
 * Tests for ERC-8004 Reputation Registry Service
 * 
 * Tests the fetchReputationMetrics and subscribeToReputationUpdates functions
 * to ensure correct behavior for reputation data fetching and polling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchReputationMetrics, subscribeToReputationUpdates } from '../erc8004'
import { ReputationMetrics } from '@/types/agent'

describe('erc8004 - ERC-8004 Reputation Registry Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('fetchReputationMetrics', () => {
    it('should fetch reputation metrics successfully', async () => {
      const mockMetrics: ReputationMetrics = {
        sharpeRatio: 1.5,
        drawdownPercentage: 8.5,
        validationScore: 98,
        updatedAt: Date.now(),
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetrics),
        } as Response)
      )

      const result = await fetchReputationMetrics('agent-123')

      expect(result).toEqual(mockMetrics)
      expect(global.fetch).toHaveBeenCalledWith('/api/agent/reputation?agentId=agent-123')
    })

    it('should return null on fetch failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found',
        } as Response)
      )

      const result = await fetchReputationMetrics('agent-123')

      expect(result).toBeNull()
    })

    it('should return null on invalid response structure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'data' }),
        } as Response)
      )

      const result = await fetchReputationMetrics('agent-123')

      expect(result).toBeNull()
    })

    it('should return null on network error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      const result = await fetchReputationMetrics('agent-123')

      expect(result).toBeNull()
    })

    it('should handle missing optional fields gracefully', async () => {
      const mockMetrics = {
        sharpeRatio: 1.5,
        drawdownPercentage: 8.5,
        validationScore: 98,
        updatedAt: Date.now(),
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetrics),
        } as Response)
      )

      const result = await fetchReputationMetrics('agent-123')

      expect(result).toEqual(mockMetrics)
    })
  })

  describe('subscribeToReputationUpdates', () => {
    it('should poll reputation metrics at 30-second intervals', async () => {
      vi.useFakeTimers()

      const mockMetrics: ReputationMetrics = {
        sharpeRatio: 1.5,
        drawdownPercentage: 8.5,
        validationScore: 98,
        updatedAt: Date.now(),
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetrics),
        } as Response)
      )

      const callback = vi.fn()
      const unsubscribe = subscribeToReputationUpdates('agent-123', callback)

      // Advance time by 30 seconds
      await vi.advanceTimersByTimeAsync(30000)

      expect(callback).toHaveBeenCalledWith(mockMetrics)

      // Advance time by another 30 seconds
      await vi.advanceTimersByTimeAsync(30000)

      expect(callback).toHaveBeenCalledTimes(2)

      unsubscribe()
      vi.useRealTimers()
    })

    it('should return unsubscribe function that stops polling', async () => {
      vi.useFakeTimers()

      const mockMetrics: ReputationMetrics = {
        sharpeRatio: 1.5,
        drawdownPercentage: 8.5,
        validationScore: 98,
        updatedAt: Date.now(),
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetrics),
        } as Response)
      )

      const callback = vi.fn()
      const unsubscribe = subscribeToReputationUpdates('agent-123', callback)

      // Advance time by 30 seconds
      await vi.advanceTimersByTimeAsync(30000)

      expect(callback).toHaveBeenCalledTimes(1)

      // Unsubscribe
      unsubscribe()

      // Advance time by another 30 seconds
      await vi.advanceTimersByTimeAsync(30000)

      // Callback should not be called again
      expect(callback).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it('should not call callback if fetch fails', async () => {
      vi.useFakeTimers()

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Error',
        } as Response)
      )

      const callback = vi.fn()
      const unsubscribe = subscribeToReputationUpdates('agent-123', callback)

      // Advance time by 30 seconds
      await vi.advanceTimersByTimeAsync(30000)

      expect(callback).not.toHaveBeenCalled()

      unsubscribe()
      vi.useRealTimers()
    })
  })
})
