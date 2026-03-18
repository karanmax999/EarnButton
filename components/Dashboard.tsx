'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

// ─── Count-up animation ───────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    if (target === prev.current) return
    const from = prev.current
    prev.current = target
    if (target === 0) { setDisplay(0); return }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (target - from) * eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return display
}
import { useAccount } from 'wagmi'
import { useBalance } from '@/lib/hooks'
import { useYOVaults } from '@/lib/hooks/useYOVaults'
import { useVaultAPY } from '@/lib/hooks/useVaultAPY'
import { useWithdraw } from '@/lib/hooks/useWithdraw'
import {
  calculateTotalDeposited,
  calculateTotalValue,
  calculateYieldEarned,
  calculateWeightedAPY,
} from '@/lib/portfolio'
import { formatUSDC, formatAPY, formatTxHash } from '@/lib/formatting'
import { BLOCK_EXPLORER, REFRESH_INTERVALS, YO_VAULTS } from '@/lib/constants'
import { getRecordedDeposit } from '@/lib/depositStore'
import { useToast } from '@/components/Toast'
import { Skeleton } from '@/components/ui/Skeleton'
import type { VaultPosition } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DashboardProps {
  userAddress: string
  onDeposit?: () => void
  onDepositSuccess?: (refetch: () => void) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Animated spinner */
function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-current ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/** Basescan transaction link */
function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`${BLOCK_EXPLORER.BASE}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-xs font-mono transition-colors"
    >
      {formatTxHash(hash)}
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string
  /** Optional accent color class for the value text */
  valueColor?: string
  isLoading: boolean
  /** Optional small sub-label below the value */
  subLabel?: string
}

function SummaryCard({ label, value, valueColor = 'text-neutral-900', isLoading, subLabel }: SummaryCardProps) {
  // Parse numeric value for count-up (strip $ and commas)
  const numericTarget = parseFloat(value.replace(/[$,+]/g, '')) || 0
  const animated = useCountUp(isLoading ? 0 : numericTarget)
  const prefix = value.startsWith('+') ? '+' : value.startsWith('$') ? '$' : ''
  const displayValue = isLoading ? value : `${prefix}${animated.toFixed(2)}`

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
      {isLoading ? (
        <Skeleton width={112} height={28} borderRadius="0.5rem" />
      ) : (
        <span className={`text-2xl font-bold ${valueColor}`}>{displayValue}</span>
      )}
      {subLabel && !isLoading && (
        <span className="text-xs text-neutral-400">{subLabel}</span>
      )}
    </div>
  )
}

// ─── WithdrawForm ─────────────────────────────────────────────────────────────

interface WithdrawFormProps {
  position: VaultPosition
  onSuccess: () => void
  onCancel: () => void
}

function WithdrawForm({ position, onSuccess, onCancel }: WithdrawFormProps) {
  const [shareInput, setShareInput] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)

  const { addToast } = useToast()
  const { withdraw, isWithdrawing, txHash, error: withdrawError, reset } = useWithdraw()

  const vaultConfig = YO_VAULTS.find((v) => v.address.toLowerCase() === position.vaultAddress.toLowerCase())
  const decimals = vaultConfig?.decimals ?? 6
  const decimalsFactor = 10 ** decimals

  // Parse share input to bigint using vault's actual decimals
  const parsedShares: bigint = (() => {
    const num = parseFloat(shareInput.trim())
    if (isNaN(num) || num <= 0) return 0n
    return BigInt(Math.round(num * decimalsFactor))
  })()

  const isValid = parsedShares > 0n && parsedShares <= position.shares

  // Validate on input change
  useEffect(() => {
    if (!shareInput) { setValidationError(null); return }
    const num = parseFloat(shareInput.trim())
    if (isNaN(num) || num <= 0) {
      setValidationError('Amount must be greater than zero')
      return
    }
    if (parsedShares > position.shares) {
      setValidationError('Exceeds your share balance')
      return
    }
    setValidationError(null)
  }, [shareInput, parsedShares, position.shares])

  // Detect success: had a txHash and no longer withdrawing
  useEffect(() => {
    if (!isWithdrawing && txHash && !withdrawError) {
      setWithdrawSuccess(true)
      addToast('success', `Withdrawal confirmed · ${formatTxHash(txHash)}`)
    }
  }, [isWithdrawing, txHash, withdrawError, addToast])

  // Toast on error
  useEffect(() => {
    if (!withdrawError) return
    const msg = withdrawError.message ?? ''
    addToast('error', msg.includes('rejected') ? 'Transaction rejected' : (msg || 'Withdrawal failed'))
  }, [withdrawError, addToast])

  const handleMax = () => {
    setShareInput((Number(position.shares) / decimalsFactor).toFixed(decimals > 8 ? 8 : decimals))
  }

  const handleSubmit = async () => {
    if (!isValid) return
    try {
      await withdraw({ vaultAddress: position.vaultAddress as `0x${string}`, shares: parsedShares })
    } catch {
      // error surfaced via withdrawError
    }
  }

  const handleSuccessDone = () => {
    reset()
    onSuccess()
  }

  if (withdrawSuccess) {
    return (
      <div className="mt-3 rounded-xl bg-success-50 border border-success-200 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-success-700 font-semibold text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Withdrawal successful!
        </div>
        {txHash && <TxLink hash={txHash} />}
        <button
          type="button"
          onClick={handleSuccessDone}
          className="mt-1 rounded-lg bg-success-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-success-700 transition-colors w-fit"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Withdraw shares</p>

      {/* Share balance */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Available shares</span>
        <span className="font-medium text-neutral-700">
          {(Number(position.shares) / decimalsFactor).toFixed(decimals > 8 ? 8 : decimals)}
        </span>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2
                      focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <input
          type="number"
          min="0"
          step="any"
          placeholder="0.000000"
          value={shareInput}
          onChange={(e) => setShareInput(e.target.value)}
          className="flex-1 bg-transparent text-sm font-semibold text-neutral-900 outline-none
                     placeholder:text-neutral-400 [appearance:textfield]
                     [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Shares to withdraw"
        />
        <button
          type="button"
          onClick={handleMax}
          className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
        >
          Max
        </button>
      </div>

      {validationError && (
        <p className="text-xs font-medium text-danger-600" role="alert">{validationError}</p>
      )}

      {withdrawError && (
        <p className="text-xs font-medium text-danger-600" role="alert">
          {withdrawError.message.includes('rejected') ? 'Transaction rejected by user' : withdrawError.message}
        </p>
      )}

      {/* Pending tx link */}
      {isWithdrawing && txHash && (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Spinner className="h-3 w-3" />
          <TxLink hash={txHash} />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isWithdrawing}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger-600 py-2 text-xs font-semibold text-white
                     hover:bg-danger-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isWithdrawing ? (
            <>
              <Spinner className="h-3 w-3" />
              Withdrawing...
            </>
          ) : (
            'Confirm Withdraw'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isWithdrawing}
          className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-600
                     hover:bg-neutral-100 transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── PositionCard ─────────────────────────────────────────────────────────────

interface PositionCardProps {
  position: VaultPosition
  onWithdrawSuccess: () => void
}

function PositionCard({ position, onWithdrawSuccess }: PositionCardProps) {
  const [showWithdraw, setShowWithdraw] = useState(false)

  const yieldEarned = position.currentValue - position.depositedAmount
  const yieldPositive = yieldEarned >= 0n

  const handleWithdrawSuccess = () => {
    setShowWithdraw(false)
    onWithdrawSuccess()
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-900">{position.vaultName}</h3>
            <a
              href={`${BLOCK_EXPLORER.BASE}/address/${position.vaultAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-blue-600 transition-colors"
              aria-label="View contract on Basescan"
            >
              ↗ contract
            </a>
          </div>
          <span className="text-xs font-medium text-success-600 bg-success-50 rounded-full px-2 py-0.5 mt-1 inline-block">
            {formatAPY(position.apy)} APY
          </span>
        </div>
        {!showWithdraw && (
          <button
            type="button"
            onClick={() => setShowWithdraw(true)}
            className="shrink-0 rounded-xl border border-danger-300 px-3 py-1.5 text-xs font-semibold text-danger-600
                       hover:bg-danger-50 transition-colors"
          >
            Withdraw
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-0.5">
          <p className="text-xs text-neutral-500">Deposited</p>
          <p className="text-sm font-semibold text-neutral-800">${formatUSDC(position.depositedAmount)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-neutral-500">Current Value</p>
          <p className="text-sm font-semibold text-neutral-800">${formatUSDC(position.currentValue)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-neutral-500">Shares</p>
          <p className="text-sm font-semibold text-neutral-800">{formatUSDC(position.shares)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-neutral-500">Yield Earned</p>
          <p className={`text-sm font-semibold ${yieldPositive ? 'text-success-600' : 'text-danger-600'}`}>
            {yieldPositive ? '+' : '-'}${formatUSDC(yieldPositive ? yieldEarned : -yieldEarned)}
          </p>
        </div>
      </div>

      {/* Inline withdraw form */}
      {showWithdraw && (
        <WithdrawForm
          position={position}
          onSuccess={handleWithdrawSuccess}
          onCancel={() => setShowWithdraw(false)}
        />
      )}
    </div>
  )
}

// ─── PositionList ─────────────────────────────────────────────────────────────

interface PositionListProps {
  positions: VaultPosition[]
  isLoading: boolean
  onWithdrawSuccess: () => void
  onDeposit?: () => void
}

function PositionList({ positions, isLoading, onWithdrawSuccess, onDeposit }: PositionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-5">
            <Skeleton width={160} height={20} className="mb-3" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-1">
                  <Skeleton width={64} height={12} />
                  <Skeleton width={80} height={16} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-soft p-10 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <svg className="h-7 w-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-neutral-700">No positions yet.</p>
          <p className="text-sm text-neutral-500">Deposit USDC, ETH, BTC or EUR to start earning yield.</p>
          {onDeposit && (
            <button
              type="button"
              onClick={onDeposit}
              className="mt-1 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-primary-400 hover:to-primary-500 transition-all"
            >
              Make your first deposit
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {positions.map((pos) => (
        <PositionCard
          key={pos.vaultAddress}
          position={pos}
          onWithdrawSuccess={onWithdrawSuccess}
        />
      ))}
    </div>
  )
}

// ─── PerVaultBalance ──────────────────────────────────────────────────────────
// A small helper component that fetches the share balance for one vault
// and calls back with the result so the parent can build positions.

interface VaultBalanceLoaderProps {
  userAddress: string
  vaultAddress: `0x${string}`
  onResult: (vaultAddress: string, shares: bigint, refetch: () => Promise<void>) => void
}

function VaultBalanceLoader({
  userAddress,
  vaultAddress,
  onResult,
}: VaultBalanceLoaderProps) {
  const { balance, refetch } = useBalance({
    address: userAddress as `0x${string}`,
    token: 'vault',
    vaultAddress,
  })

  useEffect(() => {
    onResult(vaultAddress, balance, refetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, vaultAddress])

  return null
}

// ─── VaultSharePriceLoader ────────────────────────────────────────────────────
// Fetches share price for one vault and reports it back to the parent.

interface VaultSharePriceLoaderProps {
  vaultAddress: string
  onResult: (vaultAddress: string, sharePrice: number) => void
}

function VaultSharePriceLoader({ vaultAddress, onResult }: VaultSharePriceLoaderProps) {
  const { sharePrice } = useVaultAPY(vaultAddress)
  useEffect(() => {
    onResult(vaultAddress, sharePrice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharePrice, vaultAddress])
  return null
}

// ─── Dashboard (main) ─────────────────────────────────────────────────────────

function DashboardInner({ userAddress, onDeposit, onDepositSuccess }: DashboardProps) {
  const { vaults, isLoading: vaultsLoading } = useYOVaults()
  const { address: walletAddress } = useAccount()

  // Map of vaultAddress → { shares, refetch }
  const [shareMap, setShareMap] = useState<
    Record<string, { shares: bigint; refetch: () => Promise<void> }>
  >({})

  // Map of vaultAddress → sharePrice (from API)
  const [sharePriceMap, setSharePriceMap] = useState<Record<string, number>>({})

  // Last refreshed timestamp
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const handleVaultResult = useCallback(
    (vaultAddress: string, shares: bigint, refetch: () => Promise<void>) => {
      setShareMap((prev) => {
        if (prev[vaultAddress]?.shares === shares) return prev
        return { ...prev, [vaultAddress]: { shares, refetch } }
      })
    },
    [],
  )

  const handleSharePriceResult = useCallback((vaultAddress: string, sharePrice: number) => {
    setSharePriceMap((prev) => {
      if (prev[vaultAddress] === sharePrice) return prev
      return { ...prev, [vaultAddress]: sharePrice }
    })
  }, [])

  // Build positions from vaults that have a non-zero share balance
  const positions: VaultPosition[] = vaults
    .filter((v) => (shareMap[v.address]?.shares ?? 0n) > 0n)
    .map((v) => {
      const shares = shareMap[v.address]?.shares ?? 0n
      const vaultConfig = YO_VAULTS.find((c) => c.address.toLowerCase() === v.address.toLowerCase())
      const decimals = vaultConfig?.decimals ?? 6

      // currentValue = shares * sharePrice (sharePrice defaults to 1 if API unavailable)
      const sharePrice = sharePriceMap[v.address] ?? 1
      const sharesFloat = Number(shares) / 10 ** decimals
      const currentValueFloat = sharesFloat * sharePrice
      const currentValue = BigInt(Math.round(currentValueFloat * 10 ** decimals))

      // depositedAmount from localStorage — falls back to shares if no record
      const recorded = walletAddress ? getRecordedDeposit(walletAddress, v.address) : 0n
      const depositedAmount = recorded > 0n ? recorded : shares

      return {
        vaultAddress: v.address,
        vaultName: v.name,
        depositedAmount,
        currentValue,
        shares,
        apy: v.apy,
        depositedAt: Math.floor(Date.now() / 1000),
      } satisfies VaultPosition
    })

  const isLoading = vaultsLoading
  // Portfolio summary
  const totalDeposited = calculateTotalDeposited(positions)
  const totalValue = calculateTotalValue(positions)
  const yieldEarned = calculateYieldEarned(positions)
  const weightedAPY = calculateWeightedAPY(positions)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      Object.values(shareMap).forEach(({ refetch }) => refetch())
      setLastRefreshed(new Date())
    }, REFRESH_INTERVALS.PORTFOLIO_DATA)
    return () => clearInterval(id)
  }, [shareMap])

  // Refetch all balances (called after a successful withdrawal or deposit)
  const refetchAll = useCallback(() => {
    Object.values(shareMap).forEach(({ refetch }) => refetch())
  }, [shareMap])

  // Expose refetchAll to parent so EarnModal can trigger a refresh after deposit
  useEffect(() => {
    onDepositSuccess?.(refetchAll)
  }, [refetchAll, onDepositSuccess])

  return (
    <div className="space-y-6">
      {/* Render invisible balance + share price loaders for each vault */}
      {vaults.map((v) => (
        <React.Fragment key={v.address}>
          <VaultBalanceLoader
            userAddress={userAddress}
            vaultAddress={v.address as `0x${string}`}
            onResult={handleVaultResult}
          />
          <VaultSharePriceLoader
            vaultAddress={v.address}
            onResult={handleSharePriceResult}
          />
        </React.Fragment>
      ))}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Total Deposited"
          value={`$${formatUSDC(totalDeposited)}`}
          isLoading={isLoading}
        />
        <SummaryCard
          label="Current Value"
          value={`$${formatUSDC(totalValue)}`}
          isLoading={isLoading}
        />
        <SummaryCard
          label="Yield Earned"
          value={`${yieldEarned >= 0n ? '+' : '-'}$${formatUSDC(yieldEarned >= 0n ? yieldEarned : -yieldEarned)}`}
          valueColor={yieldEarned >= 0n ? 'text-success-600' : 'text-danger-600'}
          isLoading={isLoading}
        />
        <SummaryCard
          label="Weighted APY"
          value={formatAPY(weightedAPY)}
          valueColor="text-primary-600"
          isLoading={isLoading}
        />
      </div>

      {/* ── Positions ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">Your Positions</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live on Base Mainnet
            </span>
            <span className="text-xs text-neutral-400">
              · Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <PositionList
          positions={positions}
          isLoading={isLoading}
          onWithdrawSuccess={refetchAll}
          onDeposit={onDeposit}
        />
      </div>
    </div>
  )
}

const Dashboard = React.memo(DashboardInner)
export default Dashboard
