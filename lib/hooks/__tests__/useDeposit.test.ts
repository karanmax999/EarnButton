import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDeposit } from '../useDeposit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { CONTRACTS } from '../../constants'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  usePublicClient: vi.fn(),
}))

describe('useDeposit', () => {
  const mockUserAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
  const mockVaultAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`
  const mockAmount = 1000000000n // 1000 USDC (6 decimals)
  const mockApprovalTxHash = '0xapproval123' as `0x${string}`
  const mockDepositTxHash = '0xdeposit456' as `0x${string}`
  
  const mockWriteApproval = vi.fn()
  const mockWriteDeposit = vi.fn()
  const mockReadContract = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock for useAccount
    vi.mocked(useAccount).mockReturnValue({
      address: mockUserAddress,
    } as any)
    
    // Default mock for usePublicClient
    vi.mocked(usePublicClient).mockReturnValue({
      readContract: mockReadContract,
    } as any)
    
    // Default mocks for useWriteContract (approval)
    vi.mocked(useWriteContract).mockReturnValueOnce({
      writeContract: mockWriteApproval,
      data: undefined,
      isPending: false,
      error: null,
    } as any)
    
    // Default mocks for useWriteContract (deposit)
    vi.mocked(useWriteContract).mockReturnValueOnce({
      writeContract: mockWriteDeposit,
      data: undefined,
      isPending: false,
      error: null,
    } as any)
    
    // Default mocks for useWaitForTransactionReceipt (approval)
    vi.mocked(useWaitForTransactionReceipt).mockReturnValueOnce({
      isLoading: false,
      isSuccess: false,
    } as any)
    
    // Default mocks for useWaitForTransactionReceipt (deposit)
    vi.mocked(useWaitForTransactionReceipt).mockReturnValueOnce({
      isLoading: false,
      isSuccess: false,
    } as any)
  })

  describe('checkApproval', () => {
    it('should return true when sufficient approval exists', async () => {
      mockReadContract.mockResolvedValue(2000000000n) // 2000 USDC approved
      
      const { result } = renderHook(() => useDeposit())
      
      const hasApproval = await result.current.checkApproval({
        vaultAddress: mockVaultAddress,
        amount: mockAmount,
      })
      
      expect(hasApproval).toBe(true)
      expect(mockReadContract).toHaveBeenCalledWith({
        address: CONTRACTS.USDC,
        abi: expect.any(Array),
        functionName: 'allowance',
        args: [mockUserAddress, mockVaultAddress],
      })
    })

    it('should return false when insufficient approval exists', async () => {
      mockReadContract.mockResolvedValue(500000000n) // Only 500 USDC approved
      
      const { result } = renderHook(() => useDeposit())
      
      const hasApproval = await result.current.checkApproval({
        vaultAddress: mockVaultAddress,
        amount: mockAmount,
      })
      
      expect(hasApproval).toBe(false)
    })


    it('should return false when no approval exists', async () => {
      mockReadContract.mockResolvedValue(0n)
      
      const { result } = renderHook(() => useDeposit())
      
      const hasApproval = await result.current.checkApproval({
        vaultAddress: mockVaultAddress,
        amount: mockAmount,
      })
      
      expect(hasApproval).toBe(false)
    })

    it('should throw error when wallet not connected', async () => {
      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      await expect(
        result.current.checkApproval({
          vaultAddress: mockVaultAddress,
          amount: mockAmount,
        })
      ).rejects.toThrow('Wallet not connected')
    })

    it('should return false on contract read error', async () => {
      mockReadContract.mockRejectedValue(new Error('Contract read failed'))
      
      const { result } = renderHook(() => useDeposit())
      
      const hasApproval = await result.current.checkApproval({
        vaultAddress: mockVaultAddress,
        amount: mockAmount,
      })
      
      expect(hasApproval).toBe(false)
    })
  })

  describe('approve', () => {
    it('should call writeContract with exact approval amount', async () => {
      const { result } = renderHook(() => useDeposit())
      
      await result.current.approve({
        vaultAddress: mockVaultAddress,
        amount: mockAmount,
      })
      
      expect(mockWriteApproval).toHaveBeenCalledWith({
        address: CONTRACTS.USDC,
        abi: expect.any(Array),
        functionName: 'approve',
        args: [mockVaultAddress, mockAmount],
      })
    })


    it('should set error when wallet not connected', async () => {
      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      await result.current.approve({
        vaultAddress: mockVaultAddress,
        amount: mockAmount,
      })
      
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Please connect your wallet')
    })

    it('should track approval transaction hash', () => {
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: mockApprovalTxHash,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.approvalTxHash).toBe(mockApprovalTxHash)
    })

    it('should set isApproving to true when transaction pending', () => {
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: mockApprovalTxHash,
        isPending: true,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.isApproving).toBe(true)
    })


    it('should set isApproving to true when transaction confirming', () => {
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: mockApprovalTxHash,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWaitForTransactionReceipt).mockReturnValueOnce({
        isLoading: true,
        isSuccess: false,
      } as any)
      
      vi.mocked(useWaitForTransactionReceipt).mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.isApproving).toBe(true)
    })
  })

  describe('deposit', () => {
    it('should call writeContract with correct vault deposit parameters', async () => {
      const { result } = renderHook(() => useDeposit())
      
      await result.current.deposit({
        vaultAddress: mockVaultAddress,
        amount: mockAmount,
      })
      
      expect(mockWriteDeposit).toHaveBeenCalledWith({
        address: mockVaultAddress,
        abi: expect.any(Array),
        functionName: 'deposit',
        args: [mockAmount, mockUserAddress],
      })
    })

    it('should set error when wallet not connected', async () => {
      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      await result.current.deposit({
        vaultAddress: mockVaultAddress,
        amount: mockAmount,
      })
      
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Please connect your wallet')
    })


    it('should track deposit transaction hash', () => {
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: mockDepositTxHash,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.depositTxHash).toBe(mockDepositTxHash)
    })

    it('should set isDepositing to true when transaction pending', () => {
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: mockDepositTxHash,
        isPending: true,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.isDepositing).toBe(true)
    })

    it('should set isDepositing to true when transaction confirming', () => {
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: mockDepositTxHash,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWaitForTransactionReceipt).mockReturnValueOnce({
        isLoading: false,
        isSuccess: false,
      } as any)
      
      vi.mocked(useWaitForTransactionReceipt).mockReturnValueOnce({
        isLoading: true,
        isSuccess: false,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.isDepositing).toBe(true)
    })
  })


  describe('error handling', () => {
    it('should set error when approval fails', () => {
      const mockError = new Error('User rejected transaction')
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: undefined,
        isPending: false,
        error: mockError,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Approval failed')
    })

    it('should set error when deposit fails', () => {
      const mockError = new Error('Insufficient balance')
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: undefined,
        isPending: false,
        error: mockError,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Deposit failed')
    })
  })

  describe('reset', () => {
    it('should clear all state when reset is called', () => {
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: mockApprovalTxHash,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: mockDepositTxHash,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      // Verify state is set
      expect(result.current.approvalTxHash).toBe(mockApprovalTxHash)
      expect(result.current.depositTxHash).toBe(mockDepositTxHash)
      
      // Reset
      result.current.reset()
      
      // Verify state is cleared
      expect(result.current.approvalTxHash).toBeUndefined()
      expect(result.current.depositTxHash).toBeUndefined()
      expect(result.current.error).toBeNull()
    })
  })

  describe('two-step flow', () => {
    it('should track both approval and deposit transactions separately', () => {
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteApproval,
        data: mockApprovalTxHash,
        isPending: false,
        error: null,
      } as any)
      
      vi.mocked(useWriteContract).mockReturnValueOnce({
        writeContract: mockWriteDeposit,
        data: mockDepositTxHash,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useDeposit())
      
      expect(result.current.approvalTxHash).toBe(mockApprovalTxHash)
      expect(result.current.depositTxHash).toBe(mockDepositTxHash)
      expect(result.current.approvalTxHash).not.toBe(result.current.depositTxHash)
    })
  })
})
