import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { useDeposit } from '../useDeposit'

const mockWriteApproval = vi.fn()
const mockWriteDeposit = vi.fn()
const mockPublicClient = { readContract: vi.fn() }

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  usePublicClient: vi.fn(),
}))

const mockUserAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
const mockVaultAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`
const mockAmount = 1000000000n
const mockApprovalTxHash = '0xapproval123' as `0x${string}`
const mockDepositTxHash = '0xdeposit456' as `0x${string}`

// useDeposit calls useWriteContract twice (approval + deposit) and useWaitForTransactionReceipt twice
function setupMocks(opts: {
  approvalData?: `0x${string}`
  approvalPending?: boolean
  depositData?: `0x${string}`
  depositPending?: boolean
  depositError?: Error | null
  approvalConfirming?: boolean
  depositConfirming?: boolean
  userAddress?: `0x${string}` | undefined
} = {}) {
  const {
    approvalData, approvalPending = false,
    depositData, depositPending = false, depositError = null,
    approvalConfirming = false, depositConfirming = false,
    userAddress = mockUserAddress,
  } = opts

  vi.mocked(useAccount).mockReturnValue({ address: userAddress } as any)
  vi.mocked(usePublicClient).mockReturnValue(mockPublicClient as any)

  let wc = 0
  vi.mocked(useWriteContract).mockImplementation(() => {
    wc++
    if (wc === 1) return { writeContract: mockWriteApproval, data: approvalData, isPending: approvalPending, error: null } as any
    return { writeContract: mockWriteDeposit, data: depositData, isPending: depositPending, error: depositError } as any
  })

  let wfr = 0
  vi.mocked(useWaitForTransactionReceipt).mockImplementation(() => {
    wfr++
    if (wfr === 1) return { isLoading: approvalConfirming, isSuccess: false } as any
    return { isLoading: depositConfirming, isSuccess: false } as any
  })
}

describe('useDeposit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPublicClient.readContract.mockResolvedValue(BigInt('999999999999'))
    setupMocks()
  })

  describe('checkApproval', () => {
    it('should return true when sufficient approval exists', async () => {
      mockPublicClient.readContract.mockResolvedValue(2000000000n)
      const { result } = renderHook(() => useDeposit())
      const hasApproval = await result.current.checkApproval({ vaultAddress: mockVaultAddress, amount: mockAmount })
      expect(hasApproval).toBe(true)
    })

    it('should return false when insufficient approval exists', async () => {
      mockPublicClient.readContract.mockResolvedValue(500000000n)
      const { result } = renderHook(() => useDeposit())
      const hasApproval = await result.current.checkApproval({ vaultAddress: mockVaultAddress, amount: mockAmount })
      expect(hasApproval).toBe(false)
    })

    it('should return false when no approval exists', async () => {
      mockPublicClient.readContract.mockResolvedValue(0n)
      const { result } = renderHook(() => useDeposit())
      const hasApproval = await result.current.checkApproval({ vaultAddress: mockVaultAddress, amount: mockAmount })
      expect(hasApproval).toBe(false)
    })

    it('should return false on contract read error', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('Contract read failed'))
      const { result } = renderHook(() => useDeposit())
      const hasApproval = await result.current.checkApproval({ vaultAddress: mockVaultAddress, amount: mockAmount })
      expect(hasApproval).toBe(false)
    })
  })

  describe('approve', () => {
    it('should call writeContract with approval parameters', async () => {
      const { result } = renderHook(() => useDeposit())
      await act(async () => {
        await result.current.approve({ vaultAddress: mockVaultAddress, amount: mockAmount })
      })
      expect(mockWriteApproval).toHaveBeenCalledWith(
        expect.objectContaining({ functionName: 'approve', args: expect.arrayContaining([mockAmount]) })
      )
    })

    it('should set isApproving to true when transaction pending', () => {
      setupMocks({ approvalPending: true })
      const { result } = renderHook(() => useDeposit())
      expect(result.current.isApproving).toBe(true)
    })

    it('should set isApproving to true when transaction confirming', () => {
      setupMocks({ approvalConfirming: true })
      const { result } = renderHook(() => useDeposit())
      expect(result.current.isApproving).toBe(true)
    })
  })

  describe('deposit', () => {
    it('should call writeContract with deposit parameters', async () => {
      const { result } = renderHook(() => useDeposit())
      await act(async () => {
        await result.current.deposit({ vaultAddress: mockVaultAddress, amount: mockAmount })
      })
      expect(mockWriteDeposit).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'deposit',
          args: expect.arrayContaining([mockVaultAddress, mockAmount]),
        })
      )
    })

    it('should set isDepositing to true when transaction pending', () => {
      setupMocks({ depositPending: true })
      const { result } = renderHook(() => useDeposit())
      expect(result.current.isDepositing).toBe(true)
    })

    it('should set isDepositing to true when transaction confirming', () => {
      setupMocks({ depositConfirming: true })
      const { result } = renderHook(() => useDeposit())
      expect(result.current.isDepositing).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should set error when deposit write fails', () => {
      const mockError = new Error('Insufficient balance')
      setupMocks({ depositError: mockError })
      const { result } = renderHook(() => useDeposit())
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Insufficient balance')
    })
  })

  describe('reset', () => {
    it('should clear local error state when reset is called', async () => {
      // Test that reset() clears errors set via setError
      vi.mocked(useAccount).mockReturnValue({ address: undefined } as any)
      const { result } = renderHook(() => useDeposit())
      await act(async () => {
        await result.current.approve({ vaultAddress: mockVaultAddress, amount: mockAmount })
      })
      expect(result.current.error?.message).toBe('Please connect your wallet')
      act(() => { result.current.reset() })
      expect(result.current.error).toBeNull()
    })
  })

  describe('two-step flow', () => {
    it('should track approval transaction hash', () => {
      setupMocks({ approvalData: mockApprovalTxHash })
      const { result } = renderHook(() => useDeposit())
      expect(result.current.approvalTxHash).toBe(mockApprovalTxHash)
    })

    it('should track deposit transaction hash', () => {
      setupMocks({ depositData: mockDepositTxHash })
      const { result } = renderHook(() => useDeposit())
      expect(result.current.depositTxHash).toBe(mockDepositTxHash)
    })
  })
})
