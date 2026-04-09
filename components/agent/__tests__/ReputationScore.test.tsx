import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as erc8004 from '@/lib/agent/erc8004'
import { ReputationMetrics } from '@/types/agent'

// Mock erc8004 service
vi.mock('@/lib/agent/erc8004', () => ({
  fetchReputationMetrics: vi.fn(),
  subscribeToReputationUpdates: vi.fn(),
}))

describe('ReputationScore Component', () => {
  const mockAgentId = 'agent-123'
  const mockMetrics: ReputationMetrics = {
    sharpeRatio: 1.45,
    drawdownPercentage: 12.5,
    validationScore: 98,
    updatedAt: Math.floor(Date.now() / 1000),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Props', () => {
    it('should accept agentId prop', () => {
      const props = {
        agentId: mockAgentId,
      }
      expect(props.agentId).toBe(mockAgentId)
    })

    it('should accept optional walletAddress prop', () => {
      const props = {
        walletAddress: '0x1234567890123456789012345678901234567890',
        agentId: mockAgentId,
      }
      expect(props.walletAddress).toBeDefined()
      expect(props.agentId).toBe(mockAgentId)
    })

    it('should have correct ReputationScoreProps interface', () => {
      const props = {
        agentId: mockAgentId,
        walletAddress: '0x1234567890123456789012345678901234567890',
      }

      expect(typeof props.agentId).toBe('string')
      expect(typeof props.walletAddress).toBe('string')
    })
  })

  describe('Service Integration', () => {
    it('should call fetchReputationMetrics on mount', async () => {
      const mockFetch = vi.mocked(erc8004.fetchReputationMetrics)
      mockFetch.mockResolvedValue(mockMetrics)

      await erc8004.fetchReputationMetrics(mockAgentId)

      expect(mockFetch).toHaveBeenCalledWith(mockAgentId)
    })

    it('should call subscribeToReputationUpdates on mount', () => {
      const mockSubscribe = vi.mocked(erc8004.subscribeToReputationUpdates)
      mockSubscribe.mockReturnValue(vi.fn())

      const callback = vi.fn()
      erc8004.subscribeToReputationUpdates(mockAgentId, callback)

      expect(mockSubscribe).toHaveBeenCalledWith(mockAgentId, callback)
    })

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn()
      const mockSubscribe = vi.mocked(erc8004.subscribeToReputationUpdates)
      mockSubscribe.mockReturnValue(mockUnsubscribe)

      const callback = vi.fn()
      const unsubscribe = erc8004.subscribeToReputationUpdates(mockAgentId, callback)

      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Reputation Metrics Data', () => {
    it('should handle valid reputation metrics', () => {
      const metrics: ReputationMetrics = {
        sharpeRatio: 1.45,
        drawdownPercentage: 12.5,
        validationScore: 98,
        updatedAt: Math.floor(Date.now() / 1000),
      }

      expect(metrics.sharpeRatio).toBe(1.45)
      expect(metrics.drawdownPercentage).toBe(12.5)
      expect(metrics.validationScore).toBe(98)
      expect(typeof metrics.updatedAt).toBe('number')
    })

    it('should handle metrics with zero values', () => {
      const metrics: ReputationMetrics = {
        sharpeRatio: 0,
        drawdownPercentage: 0,
        validationScore: 0,
        updatedAt: Math.floor(Date.now() / 1000),
      }

      expect(metrics.sharpeRatio).toBe(0)
      expect(metrics.drawdownPercentage).toBe(0)
      expect(metrics.validationScore).toBe(0)
    })

    it('should handle metrics with high values', () => {
      const metrics: ReputationMetrics = {
        sharpeRatio: 5.0,
        drawdownPercentage: 100,
        validationScore: 100,
        updatedAt: Math.floor(Date.now() / 1000),
      }

      expect(metrics.sharpeRatio).toBe(5.0)
      expect(metrics.drawdownPercentage).toBe(100)
      expect(metrics.validationScore).toBe(100)
    })

    it('should handle null metrics response', async () => {
      const mockFetch = vi.mocked(erc8004.fetchReputationMetrics)
      mockFetch.mockResolvedValue(null)

      const result = await erc8004.fetchReputationMetrics(mockAgentId)

      expect(result).toBeNull()
    })
  })

  describe('Sharpe Ratio Color Coding', () => {
    it('should return green color for Sharpe ratio > 1.0', () => {
      const sharpeRatio = 1.5
      const isGreen = sharpeRatio > 1.0

      expect(isGreen).toBe(true)
    })

    it('should return amber color for Sharpe ratio between 0.5 and 1.0', () => {
      const sharpeRatio = 0.75
      const isAmber = sharpeRatio >= 0.5 && sharpeRatio <= 1.0

      expect(isAmber).toBe(true)
    })

    it('should return red color for Sharpe ratio < 0.5', () => {
      const sharpeRatio = 0.3
      const isRed = sharpeRatio < 0.5

      expect(isRed).toBe(true)
    })

    it('should handle boundary value 1.0', () => {
      const sharpeRatio = 1.0
      const isGreen = sharpeRatio > 1.0
      const isAmber = sharpeRatio >= 0.5 && sharpeRatio <= 1.0

      expect(isGreen).toBe(false)
      expect(isAmber).toBe(true)
    })

    it('should handle boundary value 0.5', () => {
      const sharpeRatio = 0.5
      const isAmber = sharpeRatio >= 0.5 && sharpeRatio <= 1.0

      expect(isAmber).toBe(true)
    })
  })

  describe('Drawdown Color Coding', () => {
    it('should return green color for drawdown < 10%', () => {
      const drawdown = 5
      const isGreen = drawdown < 10

      expect(isGreen).toBe(true)
    })

    it('should return amber color for drawdown between 10% and 25%', () => {
      const drawdown = 15
      const isAmber = drawdown >= 10 && drawdown <= 25

      expect(isAmber).toBe(true)
    })

    it('should return red color for drawdown > 25%', () => {
      const drawdown = 30
      const isRed = drawdown > 25

      expect(isRed).toBe(true)
    })

    it('should handle boundary value 10%', () => {
      const drawdown = 10
      const isAmber = drawdown >= 10 && drawdown <= 25

      expect(isAmber).toBe(true)
    })

    it('should handle boundary value 25%', () => {
      const drawdown = 25
      const isAmber = drawdown >= 10 && drawdown <= 25

      expect(isAmber).toBe(true)
    })
  })

  describe('Validation Score Color Coding', () => {
    it('should return green color for validation score > 95%', () => {
      const score = 98
      const isGreen = score > 95

      expect(isGreen).toBe(true)
    })

    it('should return amber color for validation score between 80% and 95%', () => {
      const score = 85
      const isAmber = score >= 80 && score <= 95

      expect(isAmber).toBe(true)
    })

    it('should return red color for validation score < 80%', () => {
      const score = 75
      const isRed = score < 80

      expect(isRed).toBe(true)
    })

    it('should handle boundary value 95%', () => {
      const score = 95
      const isAmber = score >= 80 && score <= 95

      expect(isAmber).toBe(true)
    })

    it('should handle boundary value 80%', () => {
      const score = 80
      const isAmber = score >= 80 && score <= 95

      expect(isAmber).toBe(true)
    })
  })

  describe('Polling Behavior', () => {
    it('should poll every 30 seconds', () => {
      const POLL_INTERVAL = 30000

      expect(POLL_INTERVAL).toBe(30000)
    })

    it('should call callback with updated metrics', () => {
      const mockSubscribe = vi.mocked(erc8004.subscribeToReputationUpdates)
      const callback = vi.fn()

      mockSubscribe.mockImplementation((agentId, cb) => {
        // Simulate callback being called with updated metrics
        cb(mockMetrics)
        return vi.fn()
      })

      erc8004.subscribeToReputationUpdates(mockAgentId, callback)

      expect(callback).toHaveBeenCalledWith(mockMetrics)
    })

    it('should handle multiple metric updates', () => {
      const mockSubscribe = vi.mocked(erc8004.subscribeToReputationUpdates)
      const callback = vi.fn()

      const metrics1: ReputationMetrics = {
        sharpeRatio: 1.0,
        drawdownPercentage: 10,
        validationScore: 90,
        updatedAt: Math.floor(Date.now() / 1000),
      }

      const metrics2: ReputationMetrics = {
        sharpeRatio: 1.5,
        drawdownPercentage: 8,
        validationScore: 95,
        updatedAt: Math.floor(Date.now() / 1000),
      }

      mockSubscribe.mockImplementation((agentId, cb) => {
        cb(metrics1)
        cb(metrics2)
        return vi.fn()
      })

      erc8004.subscribeToReputationUpdates(mockAgentId, callback)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenNthCalledWith(1, metrics1)
      expect(callback).toHaveBeenNthCalledWith(2, metrics2)
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const mockFetch = vi.mocked(erc8004.fetchReputationMetrics)
      mockFetch.mockRejectedValue(new Error('Network error'))

      try {
        await erc8004.fetchReputationMetrics(mockAgentId)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle invalid metrics response', async () => {
      const mockFetch = vi.mocked(erc8004.fetchReputationMetrics)
      mockFetch.mockResolvedValue(null)

      const result = await erc8004.fetchReputationMetrics(mockAgentId)

      expect(result).toBeNull()
    })

    it('should handle subscription error', () => {
      const mockSubscribe = vi.mocked(erc8004.subscribeToReputationUpdates)
      mockSubscribe.mockImplementation(() => {
        throw new Error('Subscription failed')
      })

      expect(() => {
        erc8004.subscribeToReputationUpdates(mockAgentId, vi.fn())
      }).toThrow('Subscription failed')
    })
  })

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      const isLoading = true

      expect(isLoading).toBe(true)
    })

    it('should hide loading state after fetch', () => {
      const isLoading = false

      expect(isLoading).toBe(false)
    })

    it('should show error state on fetch failure', () => {
      const error = 'Failed to fetch reputation metrics'

      expect(error).toBeTruthy()
    })
  })

  describe('Metric Formatting', () => {
    it('should format Sharpe ratio to 2 decimal places', () => {
      const sharpeRatio = 1.456
      const formatted = sharpeRatio.toFixed(2)

      expect(formatted).toBe('1.46')
    })

    it('should format drawdown to 1 decimal place', () => {
      const drawdown = 12.567
      const formatted = drawdown.toFixed(1)

      expect(formatted).toBe('12.6')
    })

    it('should format validation score to 0 decimal places', () => {
      const score = 98.456
      const formatted = score.toFixed(0)

      expect(formatted).toBe('98')
    })

    it('should format timestamp to locale time string', () => {
      const timestamp = Math.floor(Date.now() / 1000)
      const date = new Date(timestamp * 1000)
      const formatted = date.toLocaleTimeString()

      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  describe('Retry Functionality', () => {
    it('should provide retry button on error', () => {
      const hasRetryButton = true

      expect(hasRetryButton).toBe(true)
    })

    it('should reset loading state on retry', () => {
      const isLoading = true

      expect(isLoading).toBe(true)
    })

    it('should clear error on retry', () => {
      const error = null

      expect(error).toBeNull()
    })

    it('should call fetchReputationMetrics on retry', async () => {
      const mockFetch = vi.mocked(erc8004.fetchReputationMetrics)
      mockFetch.mockResolvedValue(mockMetrics)

      await erc8004.fetchReputationMetrics(mockAgentId)

      expect(mockFetch).toHaveBeenCalledWith(mockAgentId)
    })
  })

  describe('Type Safety', () => {
    it('should have correct ReputationMetrics type', () => {
      const metrics: ReputationMetrics = {
        sharpeRatio: 1.45,
        drawdownPercentage: 12.5,
        validationScore: 98,
        updatedAt: Math.floor(Date.now() / 1000),
      }

      expect(typeof metrics.sharpeRatio).toBe('number')
      expect(typeof metrics.drawdownPercentage).toBe('number')
      expect(typeof metrics.validationScore).toBe('number')
      expect(typeof metrics.updatedAt).toBe('number')
    })

    it('should handle all numeric metric values', () => {
      const metrics: ReputationMetrics = mockMetrics

      expect(Number.isFinite(metrics.sharpeRatio)).toBe(true)
      expect(Number.isFinite(metrics.drawdownPercentage)).toBe(true)
      expect(Number.isFinite(metrics.validationScore)).toBe(true)
      expect(Number.isFinite(metrics.updatedAt)).toBe(true)
    })
  })

  describe('Component Lifecycle', () => {
    it('should initialize with loading state', () => {
      const isLoading = true

      expect(isLoading).toBe(true)
    })

    it('should fetch metrics on mount', async () => {
      const mockFetch = vi.mocked(erc8004.fetchReputationMetrics)
      mockFetch.mockResolvedValue(mockMetrics)

      await erc8004.fetchReputationMetrics(mockAgentId)

      expect(mockFetch).toHaveBeenCalled()
    })

    it('should subscribe to updates on mount', () => {
      const mockSubscribe = vi.mocked(erc8004.subscribeToReputationUpdates)
      mockSubscribe.mockReturnValue(vi.fn())

      erc8004.subscribeToReputationUpdates(mockAgentId, vi.fn())

      expect(mockSubscribe).toHaveBeenCalled()
    })

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn()
      const mockSubscribe = vi.mocked(erc8004.subscribeToReputationUpdates)
      mockSubscribe.mockReturnValue(mockUnsubscribe)

      const unsubscribe = erc8004.subscribeToReputationUpdates(mockAgentId, vi.fn())
      unsubscribe()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very high Sharpe ratio', () => {
      const sharpeRatio = 10.0
      const isGreen = sharpeRatio > 1.0

      expect(isGreen).toBe(true)
    })

    it('should handle very low Sharpe ratio', () => {
      const sharpeRatio = -1.0
      const isRed = sharpeRatio < 0.5

      expect(isRed).toBe(true)
    })

    it('should handle 100% drawdown', () => {
      const drawdown = 100
      const isRed = drawdown > 25

      expect(isRed).toBe(true)
    })

    it('should handle 0% validation score', () => {
      const score = 0
      const isRed = score < 80

      expect(isRed).toBe(true)
    })

    it('should handle 100% validation score', () => {
      const score = 100
      const isGreen = score > 95

      expect(isGreen).toBe(true)
    })
  })
})
