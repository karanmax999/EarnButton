/**
 * Tests for Credora Risk Rating Service
 * 
 * Tests the fetchRiskRatings and subscribeToRiskUpdates functions
 * to ensure correct behavior for risk data fetching and polling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchRiskRatings, subscribeToRiskUpdates, mapRiskLevelToColor, clearRiskRatingsCache } from '../credora'
import { RiskRating } from '@/types/agent'

describe('credora - Credora Risk Rating Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRiskRatingsCache()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('mapRiskLevelToColor', () => {
    it('should map low risk to green', () => {
      expect(mapRiskLevelToColor('low')).toBe('green')
    })

    it('should map medium risk to amber', () => {
      expect(mapRiskLevelToColor('medium')).toBe('amber')
    })

    it('should map high risk to red', () => {
      expect(mapRiskLevelToColor('high')).toBe('red')
    })
  })

  describe('fetchRiskRatings', () => {
    it('should fetch risk ratings successfully', async () => {
      const mockRatings: RiskRating[] = [
        {
          vaultAddress: '0x123',
          vaultName: 'Vault A',
          positionLimit: BigInt(1000),
          maxLeverage: 2.5,
          dailyLossLimit: BigInt(100),
          riskLevel: 'low',
          updatedAt: Date.now(),
        },
      ]

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                vaultAddress: '0x123',
                vaultName: 'Vault A',
                positionLimit: '1000',
                maxLeverage: 2.5,
                dailyLossLimit: '100',
                riskLevel: 'low',
                updatedAt: Date.now(),
              },
            ]),
        } as Response)
      )

      const result = await fetchRiskRatings(['0x123'])

      expect(result).toHaveLength(1)
      expect(result?.[0].vaultName).toBe('Vault A')
      expect(result?.[0].riskLevel).toBe('low')
    })

    it('should return empty array for empty vault addresses', async () => {
      const result = await fetchRiskRatings([])

      expect(result).toEqual([])
    })

    it('should return null on fetch failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Error',
        } as Response)
      )

      const result = await fetchRiskRatings(['0x123'])

      expect(result).toBeNull()
    })

    it('should return null if response is not an array', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'data' }),
        } as Response)
      )

      const result = await fetchRiskRatings(['0x123'])

      expect(result).toBeNull()
    })

    it('should return null on network error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      const result = await fetchRiskRatings(['0x123'])

      expect(result).toBeNull()
    })

    it('should handle multiple vault addresses', async () => {
      const mockRatings = [
        {
          vaultAddress: '0x123',
          vaultName: 'Vault A',
          positionLimit: '1000',
          maxLeverage: 2.5,
          dailyLossLimit: '100',
          riskLevel: 'low',
          updatedAt: Date.now(),
        },
        {
          vaultAddress: '0x456',
          vaultName: 'Vault B',
          positionLimit: '2000',
          maxLeverage: 3.0,
          dailyLossLimit: '200',
          riskLevel: 'medium',
          updatedAt: Date.now(),
        },
      ]

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRatings),
        } as Response)
      )

      const result = await fetchRiskRatings(['0x123', '0x456'])

      expect(result).toHaveLength(2)
      expect(result?.[0].riskLevel).toBe('low')
      expect(result?.[1].riskLevel).toBe('medium')
    })
  })

  describe('subscribeToRiskUpdates', () => {
    it('should poll risk ratings at 60-second intervals', async () => {
      vi.useFakeTimers()

      const mockRatings: RiskRating[] = [
        {
          vaultAddress: '0x123',
          vaultName: 'Vault A',
          positionLimit: BigInt(1000),
          maxLeverage: 2.5,
          dailyLossLimit: BigInt(100),
          riskLevel: 'low',
          updatedAt: Date.now(),
        },
      ]

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                vaultAddress: '0x123',
                vaultName: 'Vault A',
                positionLimit: '1000',
                maxLeverage: 2.5,
                dailyLossLimit: '100',
                riskLevel: 'low',
                updatedAt: Date.now(),
              },
            ]),
        } as Response)
      )

      const callback = vi.fn()
      const unsubscribe = subscribeToRiskUpdates(['0x123'], callback)

      // Advance time by 60 seconds
      await vi.advanceTimersByTimeAsync(60000)

      expect(callback).toHaveBeenCalledTimes(1)

      // Advance time by another 60 seconds
      await vi.advanceTimersByTimeAsync(60000)

      expect(callback).toHaveBeenCalledTimes(2)

      unsubscribe()
      vi.useRealTimers()
    })

    it('should return unsubscribe function that stops polling', async () => {
      vi.useFakeTimers()

      const mockRatings: RiskRating[] = [
        {
          vaultAddress: '0x123',
          vaultName: 'Vault A',
          positionLimit: BigInt(1000),
          maxLeverage: 2.5,
          dailyLossLimit: BigInt(100),
          riskLevel: 'low',
          updatedAt: Date.now(),
        },
      ]

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                vaultAddress: '0x123',
                vaultName: 'Vault A',
                positionLimit: '1000',
                maxLeverage: 2.5,
                dailyLossLimit: '100',
                riskLevel: 'low',
                updatedAt: Date.now(),
              },
            ]),
        } as Response)
      )

      const callback = vi.fn()
      const unsubscribe = subscribeToRiskUpdates(['0x123'], callback)

      // Advance time by 60 seconds
      await vi.advanceTimersByTimeAsync(60000)

      expect(callback).toHaveBeenCalledTimes(1)

      // Unsubscribe
      unsubscribe()

      // Advance time by another 60 seconds
      await vi.advanceTimersByTimeAsync(60000)

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
      const unsubscribe = subscribeToRiskUpdates(['0x123'], callback)

      // Advance time by 60 seconds
      await vi.advanceTimersByTimeAsync(60000)

      expect(callback).not.toHaveBeenCalled()

      unsubscribe()
      vi.useRealTimers()
    })
  })
})
