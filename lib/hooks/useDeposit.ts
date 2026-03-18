import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { erc20Abi } from 'viem'
import { CONTRACTS, YO_PARTNER_ID } from '../constants'

// ─── yoGateway ABI (minimal — deposit + allowance helpers + quote) ────────────
const YO_GATEWAY_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'assets', type: 'uint256' },
      { name: 'minSharesOut', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'partnerId', type: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'quotePreviewDeposit',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'assets', type: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'getAssetAllowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export interface UseDepositParams {
  vaultAddress: `0x${string}`
  amount: bigint
  /** Asset token address (defaults to USDC). Pass the vault's underlying asset. */
  assetAddress?: `0x${string}`
}

export interface UseDepositReturn {
  approve: (params: UseDepositParams) => Promise<void>
  deposit: (params: UseDepositParams) => Promise<void>
  checkApproval: (params: UseDepositParams) => Promise<boolean>
  isApproving: boolean
  isDepositing: boolean
  approvalTxHash?: `0x${string}`
  depositTxHash?: `0x${string}`
  error: Error | null
  reset: () => void
}

/**
 * Hook for depositing assets into YO Protocol vaults via the yoGateway.
 *
 * Flow:
 *  1. checkApproval — reads asset allowance granted to the gateway
 *  2. approve      — approves the asset (exact amount) to the gateway
 *  3. deposit      — calls gateway.deposit() with 1% slippage protection
 *
 * Gateway address: 0xF1EeE0957267b1A474323Ff9CfF7719E964969FA (Base mainnet)
 */
export function useDeposit(): UseDepositReturn {
  const { address: userAddress } = useAccount()
  const publicClient = usePublicClient()

  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>()
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>()
  const [error, setError] = useState<Error | null>(null)

  // Approval tx
  const { writeContract: writeApproval, data: approvalHash, isPending: isApprovalPending } = useWriteContract()
  const { isLoading: isApprovalConfirming } = useWaitForTransactionReceipt({ hash: approvalHash })

  // Deposit tx
  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositPending, error: depositWriteError } = useWriteContract()
  const { isLoading: isDepositConfirming } = useWaitForTransactionReceipt({ hash: depositHash })

  const isApproving = isApprovalPending || isApprovalConfirming
  const isDepositing = isDepositPending || isDepositConfirming

  if (approvalHash && approvalHash !== approvalTxHash) setApprovalTxHash(approvalHash)
  if (depositHash && depositHash !== depositTxHash) setDepositTxHash(depositHash)
  if (depositWriteError && !error) setError(new Error(depositWriteError.message))

  /**
   * Check if the gateway already has sufficient asset allowance.
   * Uses gateway.getAssetAllowance(yoVault, owner) per the docs.
   */
  const checkApproval = useCallback(async (params: UseDepositParams): Promise<boolean> => {
    if (!userAddress || !publicClient) return false
    try {
      const allowance = await publicClient.readContract({
        address: CONTRACTS.YO_GATEWAY,
        abi: YO_GATEWAY_ABI,
        functionName: 'getAssetAllowance',
        args: [params.vaultAddress, userAddress],
      })
      return (allowance as bigint) >= params.amount
    } catch {
      // Fallback: check ERC20 allowance directly on the asset token
      try {
        const asset = params.assetAddress ?? CONTRACTS.USDC
        const allowance = await publicClient.readContract({
          address: asset,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [userAddress, CONTRACTS.YO_GATEWAY],
        })
        return (allowance as bigint) >= params.amount
      } catch {
        return false
      }
    }
  }, [userAddress, publicClient])

  /**
   * Approve the asset token to the yoGateway (exact amount, not infinite).
   */
  const approve = useCallback(async (params: UseDepositParams) => {
    if (!userAddress) { setError(new Error('Please connect your wallet')); return }
    try {
      setError(null)
      const asset = params.assetAddress ?? CONTRACTS.USDC
      writeApproval({
        address: asset,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACTS.YO_GATEWAY, params.amount],
      })
    } catch (err) {
      setError(new Error(err instanceof Error ? err.message : 'Approval failed'))
      throw err
    }
  }, [userAddress, writeApproval])

  /**
   * Deposit assets into a YO vault via the gateway with 1% slippage protection.
   */
  const deposit = useCallback(async (params: UseDepositParams) => {
    if (!userAddress) { setError(new Error('Please connect your wallet')); return }
    if (!publicClient) { setError(new Error('Public client not available')); return }
    try {
      setError(null)

      // Quote expected shares, then apply 1% slippage buffer
      let minSharesOut = 0n
      try {
        const quoted = await publicClient.readContract({
          address: CONTRACTS.YO_GATEWAY,
          abi: YO_GATEWAY_ABI,
          functionName: 'quotePreviewDeposit',
          args: [params.vaultAddress, params.amount],
        }) as bigint
        minSharesOut = (quoted * 99n) / 100n
      } catch {
        // If quote fails, proceed with 0 minSharesOut (no slippage protection)
        console.warn('quotePreviewDeposit failed, proceeding without slippage protection')
      }

      writeDeposit({
        address: CONTRACTS.YO_GATEWAY,
        abi: YO_GATEWAY_ABI,
        functionName: 'deposit',
        args: [params.vaultAddress, params.amount, minSharesOut, userAddress, BigInt(YO_PARTNER_ID)],
      })
    } catch (err) {
      setError(new Error(err instanceof Error ? err.message : 'Deposit failed'))
      throw err
    }
  }, [userAddress, publicClient, writeDeposit])

  const reset = useCallback(() => {
    setApprovalTxHash(undefined)
    setDepositTxHash(undefined)
    setError(null)
  }, [])

  return { approve, deposit, checkApproval, isApproving, isDepositing, approvalTxHash, depositTxHash, error, reset }
}
