import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBalance } from '../useBalance'
import { useAccount, useReadContract } from 'wagmi'
import { CONTRACTS } from '../../constants'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
}))

describe('useBalance', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
  const mockVaultAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`
  const mockRefetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock for useAccount
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
    } as any)
  })

  describe('USDC balance fetching', () => {
    it('should fetch USDC balance for provided address', () => {
      const mockBalance = 1000000000n // 1000 USDC (6 decimals)
      
      vi.mocked(useReadContract).mockReturnValue({
        data: mockBalance,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(result.current.balance).toBe(mockBalance)
      expect(result.current.formatted).toBe('1000')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      
      // Verify correct contract address was used
      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: CONTRACTS.USDC,
          functionName: 'balanceOf',
          args: [mockAddress],
        })
      )
    })

    it('should use connected address when no address provided', () => {
      const mockBalance = 500000000n // 500 USDC
      
      vi.mocked(useReadContract).mockReturnValue({
        data: mockBalance,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          token: 'USDC',
        })
      )

      expect(result.current.balance).toBe(mockBalance)
      expect(result.current.formatted).toBe('500')
      
      // Verify connected address was used
      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [mockAddress],
        })
      )
    })

    it('should format USDC balance with proper decimals', () => {
      const testCases = [
        { balance: 1000000n, expected: '1' },
        { balance: 1500000n, expected: '1.5' },
        { balance: 1234567n, expected: '1.234567' },
        { balance: 100n, expected: '0.0001' },
        { balance: 0n, expected: '0' },
      ]

      testCases.forEach(({ balance, expected }) => {
        vi.mocked(useReadContract).mockReturnValue({
          data: balance,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
        } as any)

        const { result } = renderHook(() =>
          useBalance({
            address: mockAddress,
            token: 'USDC',
          })
        )

        expect(result.current.formatted).toBe(expected)
      })
    })
  })

  describe('Vault share balance fetching', () => {
    it('should fetch vault share balance for provided vault address', () => {
      const mockBalance = 2000000000n // 2000 shares
      
      vi.mocked(useReadContract).mockReturnValue({
        data: mockBalance,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'vault',
          vaultAddress: mockVaultAddress,
        })
      )

      expect(result.current.balance).toBe(mockBalance)
      expect(result.current.formatted).toBe('2000')
      
      // Verify correct vault address was used
      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockVaultAddress,
          functionName: 'balanceOf',
          args: [mockAddress],
        })
      )
    })

    it('should handle vault balance with different decimals', () => {
      const mockBalance = 1234567890n
      
      vi.mocked(useReadContract).mockReturnValue({
        data: mockBalance,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'vault',
          vaultAddress: mockVaultAddress,
        })
      )

      expect(result.current.balance).toBe(mockBalance)
      expect(result.current.formatted).toBe('1234.56789')
    })
  })

  describe('Loading states', () => {
    it('should return loading state when fetching balance', () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.balance).toBe(0n)
      expect(result.current.formatted).toBe('0')
    })

    it('should return zero balance when data is undefined', () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(result.current.balance).toBe(0n)
      expect(result.current.formatted).toBe('0')
    })
  })

  describe('Error handling', () => {
    it('should handle contract read errors', () => {
      const mockError = new Error('Contract read failed')
      
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Contract read failed')
      expect(result.current.balance).toBe(0n)
    })

    it('should return null error when no error occurs', () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: 1000000n,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(result.current.error).toBe(null)
    })
  })

  describe('Refetch functionality', () => {
    it('should provide refetch function', async () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: 1000000n,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(result.current.refetch).toBeDefined()
      expect(typeof result.current.refetch).toBe('function')
    })

    it('should call contract refetch when refetch is invoked', async () => {
      mockRefetch.mockResolvedValue(undefined)
      
      vi.mocked(useReadContract).mockReturnValue({
        data: 1000000n,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      await result.current.refetch()

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Query configuration', () => {
    it('should disable query when no address provided and not connected', () => {
      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
      } as any)

      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      renderHook(() =>
        useBalance({
          token: 'USDC',
        })
      )

      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            enabled: false,
          }),
        })
      )
    })

    it('should disable query when vault token but no vault address', () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'vault',
          // No vaultAddress provided
        })
      )

      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            enabled: false,
          }),
        })
      )
    })

    it('should configure 30-second cache as per requirements', () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: 1000000n,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            staleTime: 30 * 1000,
            refetchInterval: 30 * 1000,
          }),
        })
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle very large balance values', () => {
      const largeBalance = 999999999999999999n
      
      vi.mocked(useReadContract).mockReturnValue({
        data: largeBalance,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(result.current.balance).toBe(largeBalance)
      expect(result.current.formatted).toBe('999999999999.999999')
    })

    it('should handle zero balance', () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: 0n,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() =>
        useBalance({
          address: mockAddress,
          token: 'USDC',
        })
      )

      expect(result.current.balance).toBe(0n)
      expect(result.current.formatted).toBe('0')
    })
  })
})
