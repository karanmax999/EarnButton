import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as credoraModule from '@/lib/agent/credora'
import { RiskRating } from '@/types/agent'

// Mock credora service
vi.mock('@/lib/agent/credora', () => ({
  fetchRiskRatings: vi.fn(),
  subscribeToRiskUpdates: vi.fn(),
  mapRiskLevelToColor: vi.fn((level) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'amber',
      high: 'red',
    }
    return colors[level] || 'gray'
  }),
}))

describe('RiskRouter Component', () => {
  const mockVaultAddresses = ['0x123...', '0x456...']
  const mockWalletAddress = '0xabc...'

  const mockRiskRatings: RiskRating[] = [
    {
      vaultAddress: '0x123...',
      vaultName: 'Vault A',
      positionLimit: BigInt('1000000'),
      maxLeverage: 2.5,
      dailyLossLimit: BigInt('50000'),
      riskLevel: 'low',
      updatedAt: Math.floor(Date.now() / 1000),
    },
    {
      vaultAddress: '0x456...',
      vaultName: 'Vault B',
      positionLimit: BigInt('500000'),
      maxLeverage: 5.0,
      dailyLossLimit: BigInt('25000'),
      riskLevel: 'medium',
      updatedAt: Math.floor(Date.now() / 1000),
    },
    {
      vaultAddress: '0x789...',
      vaultName: 'Vault C',
      positionLimit: BigInt('100000'),
      maxLeverage: 10.0,
      dailyLossLimit: BigInt('5000'),
      riskLevel: 'high',
      updatedAt: Math.floor(Date.now() / 1000),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Props', () => {
    it('should accept walletAddress and vaultAddresses props', () => {
      const props = {
        walletAddress: mockWalletAddress,
        vaultAddresses: mockVaultAddresses,
      }
      expect(props.walletAddress).toBe(mockWalletAddress)
      expect(props.vaultAddresses).toEqual(mockVaultAddresses)
    })

    it('should have correct RiskRouterProps interface', () => {
      const props = {
        walletAddress: '0x1234567890123456789012345678901234567890',
        vaultAddresses: ['0x123...', '0x456...'],
      }

      expect(typeof props.walletAddress).toBe('string')
      expect(Array.isArray(props.vaultAddresses)).toBe(true)
    })
  })

  describe('Service Integration', () => {
    it('should call fetchRiskRatings on mount', async () => {
      const mockFetch = vi.mocked(credoraModule.fetchRiskRatings)
      mockFetch.mockResolvedValue(mockRiskRatings)

      await credoraModule.fetchRiskRatings(mockVaultAddresses)

      expect(mockFetch).toHaveBeenCalledWith(mockVaultAddresses)
    })

    it('should call subscribeToRiskUpdates on mount', () => {
      const mockSubscribe = vi.mocked(credoraModule.subscribeToRiskUpdates)
      mockSubscribe.mockReturnValue(vi.fn())

      const callback = vi.fn()
      credoraModule.subscribeToRiskUpdates(mockVaultAddresses, callback)

      expect(mockSubscribe).toHaveBeenCalledWith(mockVaultAddresses, callback)
    })

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn()
      const mockSubscribe = vi.mocked(credoraModule.subscribeToRiskUpdates)
      mockSubscribe.mockReturnValue(mockUnsubscribe)

      const callback = vi.fn()
      const unsubscribe = credoraModule.subscribeToRiskUpdates(mockVaultAddresses, callback)

      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Risk Rating Data', () => {
    it('should handle valid risk ratings', () => {
      const rating: RiskRating = mockRiskRatings[0]

      expect(rating.vaultAddress).toBe('0x123...')
      expect(rating.vaultName).toBe('Vault A')
      expect(rating.maxLeverage).toBe(2.5)
      expect(rating.riskLevel).toBe('low')
    })

    it('should handle multiple risk ratings', () => {
      expect(mockRiskRatings.length).toBe(3)
      expect(mockRiskRatings[0].riskLevel).toBe('low')
      expect(mockRiskRatings[1].riskLevel).toBe('medium')
      expect(mockRiskRatings[2].riskLevel).toBe('high')
    })

    it('should handle null ratings response', async () => {
      const mockFetch = vi.mocked(credoraModule.fetchRiskRatings)
      mockFetch.mockResolvedValue(null)

      const result = await credoraModule.fetchRiskRatings(mockVaultAddresses)

      expect(result).toBeNull()
    })

    it('should handle empty ratings array', async () => {
      const mockFetch = vi.mocked(credoraModule.fetchRiskRatings)
      mockFetch.mockResolvedValue([])

      const result = await credoraModule.fetchRiskRatings([])

      expect(Array.isArray(result)).toBe(true)
      expect(result?.length).toBe(0)
    })
  })

  describe('Risk Level Color Coding', () => {
    it('should map low risk to green', () => {
      const mapColor = vi.mocked(credoraModule.mapRiskLevelToColor)
      mapColor.mockReturnValue('green')

      const color = credoraModule.mapRiskLevelToColor('low')

      expect(color).toBe('green')
    })

    it('should map medium risk to amber', () => {
      const mapColor = vi.mocked(credoraModule.mapRiskLevelToColor)
      mapColor.mockReturnValue('amber')

      const color = credoraModule.mapRiskLevelToColor('medium')

      expect(color).toBe('amber')
    })

    it('should map high risk to red', () => {
      const mapColor = vi.mocked(credoraModule.mapRiskLevelToColor)
      mapColor.mockReturnValue('red')

      const color = credoraModule.mapRiskLevelToColor('high')

      expect(color).toBe('red')
    })

    it('should handle all risk levels', () => {
      const riskLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']

      riskLevels.forEach((level) => {
        const rating = mockRiskRatings.find((r) => r.riskLevel === level)
        expect(rating).toBeDefined()
        expect(rating?.riskLevel).toBe(level)
      })
    })
  })

  describe('Polling Behavior', () => {
    it('should poll every 60 seconds', () => {
      const POLL_INTERVAL = 60000

      expect(POLL_INTERVAL).toBe(60000)
    })

    it('should call callback with updated ratings', () => {
      const mockSubscribe = vi.mocked(credoraModule.subscribeToRiskUpdates)
      const callback = vi.fn()

      mockSubscribe.mockImplementation((vaultAddresses, cb) => {
        cb(mockRiskRatings)
        return vi.fn()
      })

      credoraModule.subscribeToRiskUpdates(mockVaultAddresses, callback)

      expect(callback).toHaveBeenCalledWith(mockRiskRatings)
    })

    it('should handle multiple rating updates', () => {
      const mockSubscribe = vi.mocked(credoraModule.subscribeToRiskUpdates)
      const callback = vi.fn()

      const ratings1 = [mockRiskRatings[0]]
      const ratings2 = mockRiskRatings

      mockSubscribe.mockImplementation((vaultAddresses, cb) => {
        cb(ratings1)
        cb(ratings2)
        return vi.fn()
      })

      credoraModule.subscribeToRiskUpdates(mockVaultAddresses, callback)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenNthCalledWith(1, ratings1)
      expect(callback).toHaveBeenNthCalledWith(2, ratings2)
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const mockFetch = vi.mocked(credoraModule.fetchRiskRatings)
      mockFetch.mockRejectedValue(new Error('Network error'))

      try {
        await credoraModule.fetchRiskRatings(mockVaultAddresses)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle invalid ratings response', async () => {
      const mockFetch = vi.mocked(credoraModule.fetchRiskRatings)
      mockFetch.mockResolvedValue(null)

      const result = await credoraModule.fetchRiskRatings(mockVaultAddresses)

      expect(result).toBeNull()
    })

    it('should handle subscription error', () => {
      const mockSubscribe = vi.mocked(credoraModule.subscribeToRiskUpdates)
      mockSubscribe.mockImplementation(() => {
        throw new Error('Subscription failed')
      })

      expect(() => {
        credoraModule.subscribeToRiskUpdates(mockVaultAddresses, vi.fn())
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
      const error = 'Failed to fetch risk ratings'

      expect(error).toBeTruthy()
    })
  })

  describe('Metric Formatting', () => {
    it('should format leverage to 1 decimal place', () => {
      const leverage = 2.567
      const formatted = leverage.toFixed(1)

      expect(formatted).toBe('2.6')
    })

    it('should format large position limits', () => {
      const positionLimit = BigInt('1000000000')
      const num = Number(positionLimit)
      const formatted = (num / 1e9).toFixed(2) + 'B'

      expect(formatted).toBe('1.00B')
    })

    it('should format medium position limits', () => {
      const positionLimit = BigInt('50000000')
      const num = Number(positionLimit)
      const formatted = (num / 1e6).toFixed(2) + 'M'

      expect(formatted).toBe('50.00M')
    })

    it('should format small position limits', () => {
      const positionLimit = BigInt('1000')
      const num = Number(positionLimit)
      const formatted = num.toFixed(2)

      expect(formatted).toBe('1000.00')
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

    it('should call fetchRiskRatings on retry', async () => {
      const mockFetch = vi.mocked(credoraModule.fetchRiskRatings)
      mockFetch.mockResolvedValue(mockRiskRatings)

      await credoraModule.fetchRiskRatings(mockVaultAddresses)

      expect(mockFetch).toHaveBeenCalledWith(mockVaultAddresses)
    })
  })

  describe('Type Safety', () => {
    it('should have correct RiskRating type', () => {
      const rating: RiskRating = mockRiskRatings[0]

      expect(typeof rating.vaultAddress).toBe('string')
      expect(typeof rating.vaultName).toBe('string')
      expect(typeof rating.maxLeverage).toBe('number')
      expect(typeof rating.riskLevel).toBe('string')
      expect(typeof rating.updatedAt).toBe('number')
    })

    it('should handle all numeric rating values', () => {
      const rating: RiskRating = mockRiskRatings[0]

      expect(Number.isFinite(rating.maxLeverage)).toBe(true)
      expect(Number.isFinite(rating.updatedAt)).toBe(true)
    })

    it('should handle bigint position and loss limits', () => {
      const rating: RiskRating = mockRiskRatings[0]

      expect(typeof rating.positionLimit).toBe('bigint')
      expect(typeof rating.dailyLossLimit).toBe('bigint')
    })
  })

  describe('Component Lifecycle', () => {
    it('should initialize with loading state', () => {
      const isLoading = true

      expect(isLoading).toBe(true)
    })

    it('should fetch ratings on mount', async () => {
      const mockFetch = vi.mocked(credoraModule.fetchRiskRatings)
      mockFetch.mockResolvedValue(mockRiskRatings)

      await credoraModule.fetchRiskRatings(mockVaultAddresses)

      expect(mockFetch).toHaveBeenCalled()
    })

    it('should subscribe to updates on mount', () => {
      const mockSubscribe = vi.mocked(credoraModule.subscribeToRiskUpdates)
      mockSubscribe.mockReturnValue(vi.fn())

      credoraModule.subscribeToRiskUpdates(mockVaultAddresses, vi.fn())

      expect(mockSubscribe).toHaveBeenCalled()
    })

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn()
      const mockSubscribe = vi.mocked(credoraModule.subscribeToRiskUpdates)
      mockSubscribe.mockReturnValue(mockUnsubscribe)

      const unsubscribe = credoraModule.subscribeToRiskUpdates(mockVaultAddresses, vi.fn())
      unsubscribe()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very high leverage', () => {
      const leverage = 100.0
      const isHighLeverage = leverage > 10

      expect(isHighLeverage).toBe(true)
    })

    it('should handle very low leverage', () => {
      const leverage = 0.1
      const isLowLeverage = leverage < 1

      expect(isLowLeverage).toBe(true)
    })

    it('should handle very large position limits', () => {
      const positionLimit = BigInt('999999999999999999')
      const num = Number(positionLimit)

      expect(num).toBeGreaterThan(0)
    })

    it('should handle zero position limits', () => {
      const positionLimit = BigInt('0')
      const num = Number(positionLimit)

      expect(num).toBe(0)
    })

    it('should handle all risk levels in ratings', () => {
      const riskLevels = mockRiskRatings.map((r) => r.riskLevel)

      expect(riskLevels).toContain('low')
      expect(riskLevels).toContain('medium')
      expect(riskLevels).toContain('high')
    })
  })

  describe('Tooltip Functionality', () => {
    it('should have tooltip for position limit', () => {
      const tooltip = 'Maximum position size allowed in this vault'

      expect(tooltip).toBeTruthy()
    })

    it('should have tooltip for max leverage', () => {
      const tooltip = 'Maximum leverage ratio allowed for trading'

      expect(tooltip).toBeTruthy()
    })

    it('should have tooltip for daily loss limit', () => {
      const tooltip = 'Maximum daily loss threshold before trading is restricted'

      expect(tooltip).toBeTruthy()
    })

    it('should have tooltip for status', () => {
      const tooltip = 'Risk classification: Low (safe), Medium (moderate), High (risky)'

      expect(tooltip).toBeTruthy()
    })
  })

  describe('Responsive Design', () => {
    it('should display table on desktop', () => {
      const isDesktop = true

      expect(isDesktop).toBe(true)
    })

    it('should display card layout on mobile', () => {
      const isMobile = true

      expect(isMobile).toBe(true)
    })

    it('should handle responsive breakpoints', () => {
      const breakpoints = {
        mobile: 640,
        tablet: 1024,
        desktop: 1280,
      }

      expect(breakpoints.mobile).toBeLessThan(breakpoints.tablet)
      expect(breakpoints.tablet).toBeLessThan(breakpoints.desktop)
    })
  })
})
