import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWithdraw } from '../useWithdraw'
import type { UseWithdrawParams } from '../useWithdraw'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: '0x1234567890123456789012345678901234567890' as `0x${string}` })),
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    data: undefined,
    isPending: false,
    error: null,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
  })),
}))

describe('useWithdraw', () => {
  const mockVaultAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`
  const mockShares = BigInt('1000000') // 1 USDC worth of shares
  
  beforeEach(() => {
    vi.clearAllMocks()
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
    it('should call writeContract with correct parameters', async () => {
      const mockWriteContract = vi.fn()
      const { useWriteContract } = await import('wagmi')
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useWithdraw())
      
      const params: UseWithdrawParams = {
        vaultAddress: mockVaultAddress,
        shares: mockShares,
      }
      
      await result.current.withdraw(params)
      
      expect(mockWriteContract).toHaveBeenCalledWith({
        address: mockVaultAddress,
        abi: expect.any(Array),
        functionName: 'redeem',
        args: [mockShares, '0x1234567890123456789012345678901234567890', '0x1234567890123456789012345678901234567890'],
      })
    })
    
    it('should set error when wallet not connected', async () => {
      const { useAccount } = await import('wagmi')
      vi.mocked(useAccount).mockReturnValue({ address: undefined } as any)
      
      const { result } = renderHook(() => useWithdraw())
      
      const params: UseWithdrawParams = {
        vaultAddress: mockVaultAddress,
        shares: mockShares,
      }
      
      await result.current.withdraw(params)
      
      expect(result.current.error).toEqual(new Error('Please connect your wallet'))
    })
    
    it('should handle withdrawal errors', async () => {
      const mockError = new Error('Transaction rejected')
      const { useWriteContract } = await import('wagmi')
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(() => { throw mockError }),
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useWithdraw())
      
      const params: UseWithdrawParams = {
        vaultAddress: mockVaultAddress,
        shares: mockShares,
      }
      
      await expect(result.current.withdraw(params)).rejects.toThrow('Transaction rejected')
    })
  })
  
  describe('Transaction States', () => {
    it('should set isWithdrawing to true when transaction is pending', () => {
      const { useWriteContract } = require('wagmi')
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: true,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useWithdraw())
      
      expect(result.current.isWithdrawing).toBe(true)
    })
    
    it('should set isWithdrawing to true when transaction is confirming', () => {
      const { useWaitForTransactionReceipt } = require('wagmi')
      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true,
        isSuccess: false,
      } as any)
      
      const { result } = renderHook(() => useWithdraw())
      
      expect(result.current.isWithdrawing).toBe(true)
    })
    
    it('should update txHash when transaction hash is available', async () => {
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`
      const { useWriteContract } = await import('wagmi')
      
      const { result, rerender } = renderHook(() => useWithdraw())
      
      // Simulate transaction hash becoming available
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: mockTxHash,
        isPending: false,
        error: null,
      } as any)
      
      rerender()
      
      await waitFor(() => {
        expect(result.current.txHash).toBe(mockTxHash)
      })
    })
    
    it('should set error when writeContract fails', async () => {
      const mockError = new Error('Insufficient shares')
      const { useWriteContract } = await import('wagmi')
      
      const { result, rerender } = renderHook(() => useWithdraw())
      
      // Simulate error from writeContract
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: undefined,
        isPending: false,
        error: mockError,
      } as any)
      
      rerender()
      
      await waitFor(() => {
        expect(result.current.error).toEqual(new Error('Withdrawal failed: Insufficient shares'))
      })
    })
  })
  
  describe('reset', () => {
    it('should reset all state', async () => {
      const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`
      const { useWriteContract } = await import('wagmi')
      
      const { result, rerender } = renderHook(() => useWithdraw())
      
      // Set some state
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: vi.fn(),
        data: mockTxHash,
        isPending: false,
        error: new Error('Test error'),
      } as any)
      
      rerender()
      
      await waitFor(() => {
        expect(result.current.txHash).toBe(mockTxHash)
      })
      
      // Reset
      result.current.reset()
      
      await waitFor(() => {
        expect(result.current.txHash).toBeUndefined()
        expect(result.current.error).toBeNull()
      })
    })
  })
  
  describe('ERC4626 Redeem Function', () => {
    it('should use correct ERC4626 redeem function signature', async () => {
      const mockWriteContract = vi.fn()
      const { useWriteContract } = await import('wagmi')
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useWithdraw())
      
      const params: UseWithdrawParams = {
        vaultAddress: mockVaultAddress,
        shares: mockShares,
      }
      
      await result.current.withdraw(params)
      
      const callArgs = mockWriteContract.mock.calls[0][0]
      expect(callArgs.functionName).toBe('redeem')
      expect(callArgs.abi).toEqual([
        {
          name: 'redeem',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'shares', type: 'uint256' },
            { name: 'receiver', type: 'address' },
            { name: 'owner', type: 'address' },
          ],
          outputs: [{ name: 'assets', type: 'uint256' }],
        },
      ])
    })
    
    it('should pass user address as both receiver and owner', async () => {
      const mockWriteContract = vi.fn()
      const mockUserAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
      
      const { useAccount, useWriteContract } = await import('wagmi')
      vi.mocked(useAccount).mockReturnValue({ address: mockUserAddress } as any)
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null,
      } as any)
      
      const { result } = renderHook(() => useWithdraw())
      
      const params: UseWithdrawParams = {
        vaultAddress: mockVaultAddress,
        shares: mockShares,
      }
      
      await result.current.withdraw(params)
      
      const callArgs = mockWriteContract.mock.calls[0][0]
      expect(callArgs.args).toEqual([mockShares, mockUserAddress, mockUserAddress])
    })
  })
})
