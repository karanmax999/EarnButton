import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { useWithdraw } from '../useWithdraw'

const mockWriteContract = vi.fn()
const mockPublicClient = { readContract: vi.fn() }

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  usePublicClient: vi.fn(),
}))

const mockUserAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
const mockVaultAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`
const mockShares = BigInt('1000000')
const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`

// useWithdraw calls useWriteContract twice (share approval + redeem) and useWaitForTransactionReceipt twice
function setupMocks(opts: {
  approvalPending?: boolean
  redeemData?: `0x${string}`
  redeemPending?: boolean
  redeemError?: Error | null
  approvalConfirming?: boolean
  redeemConfirming?: boolean
  userAddress?: `0x${string}` | undefined
} = {}) {
  const {
    approvalPending = false,
    redeemData, redeemPending = false, redeemError = null,
    approvalConfirming = false, redeemConfirming = false,
    userAddress = mockUserAddress,
  } = opts

  vi.mocked(useAccount).mockReturnValue({ address: userAddress } as any)
  vi.mocked(usePublicClient).mockReturnValue(mockPublicClient as any)

  let wc = 0
  vi.mocked(useWriteContract).mockImplementation(() => {
    wc++
    if (wc === 1) return { writeContract: mockWriteContract, data: undefined, isPending: approvalPending, error: null } as any
    return { writeContract: mockWriteContract, data: redeemData, isPending: redeemPending, error: redeemError } as any
  })

  let wfr = 0
  vi.mocked(useWaitForTransactionReceipt).mockImplementation(() => {
    wfr++
    if (wfr === 1) return { isLoading: approvalConfirming, isSuccess: false } as any
    return { isLoading: redeemConfirming, isSuccess: false } as any
  })
}

describe('useWithdraw', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteContract.mockReset()
    mockPublicClient.readContract.mockResolvedValue(BigInt('999999999999'))
    setupMocks()
  })

  describe('Initial State', () => {
    it('should return initial state with no transaction', () => {
      const { result } = renderHook(() => useWithdraw())
      expect(result.current.isWithdrawing).toBe(false)
      expect(result.current.txHash).toBeUndefined()
      expect(result.current.error).toBeNull()
      expect(typeof result.current.withdraw).toBe('function')
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('withdraw', () => {
    it('should call writeContract with redeem parameters', async () => {
      mockPublicClient.readContract.mockResolvedValue(BigInt('999999999999'))
      const { result } = renderHook(() => useWithdraw())
      await act(async () => {
        await result.current.withdraw({ vaultAddress: mockVaultAddress, shares: mockShares })
      })
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({ functionName: 'redeem' })
      )
    })

    it('should set error when wallet not connected', async () => {
      // When no wallet is connected, withdraw sets an error
      vi.mocked(useAccount).mockReturnValue({ address: undefined } as any)
      const { result } = renderHook(() => useWithdraw())
      await act(async () => {
        await result.current.withdraw({ vaultAddress: mockVaultAddress, shares: mockShares })
      })
      expect(result.current.error?.message).toBe('Please connect your wallet')
    })

    it('should handle withdrawal errors', async () => {
      // When writeContract throws, the error propagates
      mockPublicClient.readContract.mockResolvedValue(BigInt('999999999999'))
      const { result } = renderHook(() => useWithdraw())
      // Override writeContract to throw
      vi.mocked(useWriteContract).mockImplementation(() => ({
        writeContract: () => { throw new Error('Transaction rejected') },
        data: undefined,
        isPending: false,
        error: null,
      } as any))
      const { result: result2 } = renderHook(() => useWithdraw())
      await expect(
        act(async () => {
          await result2.current.withdraw({ vaultAddress: mockVaultAddress, shares: mockShares })
        })
      ).rejects.toThrow('Transaction rejected')
    })
  })

  describe('Transaction States', () => {
    it('should set isWithdrawing to true when transaction is pending', () => {
      setupMocks({ redeemPending: true })
      const { result } = renderHook(() => useWithdraw())
      expect(result.current.isWithdrawing).toBe(true)
    })

    it('should set isWithdrawing to true when transaction is confirming', () => {
      setupMocks({ redeemConfirming: true })
      const { result } = renderHook(() => useWithdraw())
      expect(result.current.isWithdrawing).toBe(true)
    })

    it('should update txHash when transaction hash is available', () => {
      setupMocks({ redeemData: mockTxHash })
      const { result } = renderHook(() => useWithdraw())
      expect(result.current.txHash).toBe(mockTxHash)
    })

    it('should set error when writeContract fails', () => {
      const mockError = new Error('Insufficient shares')
      setupMocks({ redeemError: mockError })
      const { result } = renderHook(() => useWithdraw())
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('Insufficient shares')
    })
  })

  describe('reset', () => {
    it('should reset local error state', async () => {
      // Test that reset() clears errors set via setError
      vi.mocked(useAccount).mockReturnValue({ address: undefined } as any)
      const { result } = renderHook(() => useWithdraw())
      await act(async () => {
        await result.current.withdraw({ vaultAddress: mockVaultAddress, shares: mockShares })
      })
      expect(result.current.error?.message).toBe('Please connect your wallet')
      act(() => { result.current.reset() })
      expect(result.current.error).toBeNull()
    })
  })

  describe('ERC4626 Redeem Function', () => {
    it('should use redeem function', async () => {
      mockPublicClient.readContract.mockResolvedValue(BigInt('999999999999'))
      const { result } = renderHook(() => useWithdraw())
      await act(async () => {
        await result.current.withdraw({ vaultAddress: mockVaultAddress, shares: mockShares })
      })
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({ functionName: 'redeem' })
      )
    })

    it('should pass user address as receiver', async () => {
      mockPublicClient.readContract.mockResolvedValue(BigInt('999999999999'))
      const { result } = renderHook(() => useWithdraw())
      await act(async () => {
        await result.current.withdraw({ vaultAddress: mockVaultAddress, shares: mockShares })
      })
      const callArgs = mockWriteContract.mock.calls[0][0]
      expect(callArgs.args).toContain(mockUserAddress)
    })
  })
})
