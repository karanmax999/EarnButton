import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { erc20Abi } from 'viem'
import { CONTRACTS, YO_PARTNER_ID } from '../constants'

// ─── yoGateway ABI (minimal — redeem + allowance helpers + quote) ─────────────
const YO_GATEWAY_ABI = [
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'shares', type: 'uint256' },
      { name: 'minAssetsOut', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'partnerId', type: 'uint256' },
    ],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    name: 'quotePreviewWithdraw',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'shares', type: 'uint256' },
    ],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    name: 'getShareAllowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export interface UseWithdrawParams {
  vaultAddress: `0x${string}`
  shares: bigint
}

export interface UseWithdrawReturn {
  withdraw: (params: UseWithdrawParams) => Promise<void>
  isWithdrawing: boolean
  txHash?: `0x${string}`
  error: Error | null
  reset: () => void
}

/**
 * Hook for redeeming vault shares via the yoGateway.
 *
 * Flow:
 *  1. Check share allowance granted to the gateway
 *  2. If insufficient, approve vault shares to the gateway and auto-chain redeem
 *  3. Call gateway.redeem() with 1% slippage protection
 */
export function useWithdraw(): UseWithdrawReturn {
  const { address: userAddress } = useAccount()
  const publicClient = usePublicClient()

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [error, setError] = useState<Error | null>(null)

  // Pending redeem params — stored so we can auto-chain after approval confirms
  const pendingRedeemRef = useRef<UseWithdrawParams | null>(null)

  // Share approval tx
  const { writeContract: writeShareApproval, data: approvalHash, isPending: isApprovalPending } = useWriteContract()
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ hash: approvalHash })

  // Redeem tx
  const { writeContract: writeRedeem, data: redeemHash, isPending: isRedeemPending, error: redeemWriteError } = useWriteContract()
  const { isLoading: isRedeemConfirming } = useWaitForTransactionReceipt({ hash: redeemHash })

  const isWithdrawing = isApprovalPending || isApprovalConfirming || isRedeemPending || isRedeemConfirming

  if (redeemHash && redeemHash !== txHash) setTxHash(redeemHash)
  if (redeemWriteError && !error) setError(new Error(redeemWriteError.message))

  // Auto-chain: once approval confirms, fire the redeem automatically
  useEffect(() => {
    if (!isApprovalSuccess || !pendingRedeemRef.current || !userAddress || !publicClient) return
    const params = pendingRedeemRef.current
    pendingRedeemRef.current = null

    async function fireRedeem() {
      let minAssetsOut = 0n
      try {
        const quoted = await publicClient!.readContract({
          address: CONTRACTS.YO_GATEWAY,
          abi: YO_GATEWAY_ABI,
          functionName: 'quotePreviewWithdraw',
          args: [params.vaultAddress, params.shares],
        }) as bigint
        minAssetsOut = (quoted * 99n) / 100n
      } catch {
        console.warn('quotePreviewWithdraw failed, proceeding without slippage protection')
      }
      writeRedeem({
        address: CONTRACTS.YO_GATEWAY,
        abi: YO_GATEWAY_ABI,
        functionName: 'redeem',
        args: [params.vaultAddress, params.shares, minAssetsOut, userAddress!, BigInt(YO_PARTNER_ID)],
      })
    }

    fireRedeem()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApprovalSuccess])

  const withdraw = useCallback(async (params: UseWithdrawParams) => {
    if (!userAddress) { setError(new Error('Please connect your wallet')); return }
    if (!publicClient) { setError(new Error('Public client not available')); return }

    try {
      setError(null)

      // 1. Check if gateway already has share allowance
      let shareAllowance = 0n
      try {
        shareAllowance = await publicClient.readContract({
          address: CONTRACTS.YO_GATEWAY,
          abi: YO_GATEWAY_ABI,
          functionName: 'getShareAllowance',
          args: [params.vaultAddress, userAddress],
        }) as bigint
      } catch {
        try {
          shareAllowance = await publicClient.readContract({
            address: params.vaultAddress,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [userAddress, CONTRACTS.YO_GATEWAY],
          }) as bigint
        } catch {
          shareAllowance = 0n
        }
      }

      // 2. Approve shares to gateway if needed — store params for auto-chain
      if (shareAllowance < params.shares) {
        pendingRedeemRef.current = params
        writeShareApproval({
          address: params.vaultAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [CONTRACTS.YO_GATEWAY, params.shares],
        })
        return
      }

      // 3. Quote expected assets, apply 1% slippage buffer
      let minAssetsOut = 0n
      try {
        const quoted = await publicClient.readContract({
          address: CONTRACTS.YO_GATEWAY,
          abi: YO_GATEWAY_ABI,
          functionName: 'quotePreviewWithdraw',
          args: [params.vaultAddress, params.shares],
        }) as bigint
        minAssetsOut = (quoted * 99n) / 100n
      } catch {
        console.warn('quotePreviewWithdraw failed, proceeding without slippage protection')
      }

      // 4. Redeem via gateway
      writeRedeem({
        address: CONTRACTS.YO_GATEWAY,
        abi: YO_GATEWAY_ABI,
        functionName: 'redeem',
        args: [params.vaultAddress, params.shares, minAssetsOut, userAddress, BigInt(YO_PARTNER_ID)],
      })
    } catch (err) {
      setError(new Error(err instanceof Error ? err.message : 'Withdrawal failed'))
      throw err
    }
  }, [userAddress, publicClient, writeShareApproval, writeRedeem])

  const reset = useCallback(() => {
    setTxHash(undefined)
    setError(null)
    pendingRedeemRef.current = null
  }, [])

  return { withdraw, isWithdrawing, txHash, error, reset }
}
