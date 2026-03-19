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
import { getRecordedDeposit, addActivityRecord } from '@/lib/depositStore'
import RecentActivity from '@/components/RecentActivity'
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

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-current ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a href={`${BLOCK_EXPLORER.BASE}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline text-xs font-mono transition-colors">
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
  valueColor?: string
  isLoading: boolean
  subLabel?: string
  icon?: React.ReactNode
}

function SummaryCard({ label, value, valueColor = 'text-white', isLoading, subLabel, icon }: SummaryCardProps) {
  const numericTarget = parseFloat(value.replace(/[$,+%]/g, '')) || 0
  const animated = useCountUp(isLoading ? 0 : numericTarget)
  const prefix = value.startsWith('+') ? '+' : value.startsWith('$') ? '$' : ''
  const suffix = value.endsWith('%') ? '%' : ''
  const displayValue = isLoading ? value : `${prefix}${animated.toFixed(2)}${suffix}`

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* subtle teal glow top-left */}
      <div className="absolute -top-6 -left-6 h-16 w-16 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-gray-600">{icon}</span>}
      </div>
      {isLoading ? (
        <Skeleton width={112} height={28} borderRadius="0.5rem" />
      ) : (
        <span className={`text-2xl font-bold ${valueColor}`}>{displayValue}</span>
      )}
      {subLabel && !isLoading && (
        <span className="text-xs text-gray-600">{subLabel}</span>
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

  const parsedShares: bigint = (() => {
    const num = parseFloat(shareInput.trim())
    if (isNaN(num) || num <= 0) return 0n
    return BigInt(Math.round(num * decimalsFactor))
  })()

  const isValid = parsedShares > 0n && parsedShares <= position.shares

  useEffect(() => {
    if (!shareInput) { setValidationError(null); return }
    const num = parseFloat(shareInput.trim())
    if (isNaN(num) || num <= 0) { setValidationError('Amount must be greater than zero'); return }
    if (parsedShares > position.shares) { setValidationError('Exceeds your share balance'); return }
    setValidationError(null)
  }, [shareInput, parsedShares, position.shares])

  useEffect(() => {
    if (!isWithdrawing && txHash && !withdrawError) {
      setWithdrawSuccess(true)
      addToast('success', `Withdrawal confirmed · ${formatTxHash(txHash)}`)
    }
  }, [isWithdrawing, txHash, withdrawError, addToast])

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
    try { await withdraw({ vaultAddress: position.vaultAddress as `0x${string}`, shares: parsedShares }) }
    catch { /* surfaced via withdrawError */ }
  }

  const handleSuccessDone = () => { reset(); onSuccess() }

  if (withdrawSuccess) {
    return (
      <div className="mt-3 rounded-xl p-4 flex flex-col gap-2"
        style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)' }}>
        <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Withdrawal successful!
        </div>
        {txHash && <TxLink hash={txHash} />}
        <button type="button" onClick={handleSuccessDone}
          className="mt-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white w-fit transition-colors"
          style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Withdraw shares</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Available shares</span>
        <span className="font-medium text-gray-300">{(Number(position.shares) / decimalsFactor).toFixed(decimals > 8 ? 8 : decimals)}</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
        style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.08)' }}
        onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.4)' }}
        onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)' }}>
        <input type="number" min="0" step="any" placeholder="0.000000" value={shareInput}
          onChange={(e) => setShareInput(e.target.value)}
          className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-gray-600
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Shares to withdraw" />
        <button type="button" onClick={handleMax}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-teal-400 transition-colors hover:text-teal-300"
          style={{ background: 'rgba(0,200,150,0.1)' }}>
          Max
        </button>
      </div>
      {validationError && <p className="text-xs font-medium text-red-400" role="alert">{validationError}</p>}
      {withdrawError && (
        <p className="text-xs font-medium text-red-400" role="alert">
          {withdrawError.message.includes('rejected') ? 'Transaction rejected by user' : withdrawError.message}
        </p>
      )}
      {isWithdrawing && txHash && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Spinner className="h-3 w-3" /><TxLink hash={txHash} />
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={!isValid || isWithdrawing}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          {isWithdrawing ? <><Spinner className="h-3 w-3" />Withdrawing...</> : 'Confirm Withdraw'}
        </button>
        <button type="button" onClick={onCancel} disabled={isWithdrawing}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-40"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── PositionCard ─────────────────────────────────────────────────────────────

const VAULT_ACCENT: Record<string, string> = {
  yousd: '#00c896',
  yoeth: '#627EEA',
  yobtc: '#F7931A',
  yoeur: '#2775CA',
}

interface PositionCardProps {
  position: VaultPosition
  onWithdrawSuccess: () => void
}

function PositionCard({ position, onWithdrawSuccess }: PositionCardProps) {
  const [showWithdraw, setShowWithdraw] = useState(false)
  const yieldEarned = position.currentValue - position.depositedAmount
  const yieldPositive = yieldEarned >= 0n
  const accent = VAULT_ACCENT[position.vaultName.toLowerCase()] ?? '#00c896'

  const handleWithdrawSuccess = () => { setShowWithdraw(false); onWithdrawSuccess() }

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.2)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)' }}>
      {/* Accent bar */}
      <div className="h-[3px] w-full" style={{ background: accent }} />
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">{position.vaultName}</h3>
              <a href={`${BLOCK_EXPLORER.BASE}/address/${position.vaultAddress}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-teal-400 transition-colors" aria-label="View contract on Basescan">
                ↗ contract
              </a>
            </div>
            <span className="text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,200,150,0.1)', color: '#00c896', border: '1px solid rgba(0,200,150,0.2)' }}>
              {formatAPY(position.apy)} APY
            </span>
          </div>
          {!showWithdraw && (
            <button type="button" onClick={() => setShowWithdraw(true)}
              className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
              Withdraw
            </button>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Deposited', value: `$${formatUSDC(position.depositedAmount)}`, color: 'text-gray-300' },
            { label: 'Current Value', value: `$${formatUSDC(position.currentValue)}`, color: 'text-white' },
            { label: 'Shares', value: formatUSDC(position.shares), color: 'text-gray-300' },
            {
              label: 'Yield Earned',
              value: `${yieldPositive ? '+' : '-'}$${formatUSDC(yieldPositive ? yieldEarned : -yieldEarned)}`,
              color: yieldPositive ? 'text-teal-400' : 'text-red-400',
            },
          ].map((s) => (
            <div key={s.label} className="space-y-0.5">
              <p className="text-xs text-gray-600 uppercase tracking-wider">{s.label}</p>
              <p className={`text-sm font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {showWithdraw && (
          <WithdrawForm position={position} onSuccess={handleWithdrawSuccess} onCancel={() => setShowWithdraw(false)} />
        )}
      </div>
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
          <div key={i} className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
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
      <div className="rounded-2xl p-10 text-center" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-white">No positions yet.</p>
          <p className="text-sm text-gray-500">Deposit USDC, ETH, BTC or EUR to start earning yield.</p>
          {onDeposit && (
            <button type="button" onClick={onDeposit}
              className="mt-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
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
        <PositionCard key={pos.vaultAddress} position={pos} onWithdrawSuccess={onWithdrawSuccess} />
      ))}
    </div>
  )
}

// ─── Invisible loaders ────────────────────────────────────────────────────────

interface VaultBalanceLoaderProps {
  userAddress: string
  vaultAddress: `0x${string}`
  onResult: (vaultAddress: string, shares: bigint, refetch: () => Promise<void>) => void
}

function VaultBalanceLoader({ userAddress, vaultAddress, onResult }: VaultBalanceLoaderProps) {
  const { balance, refetch } = useBalance({ address: userAddress as `0x${string}`, token: 'vault', vaultAddress })
  useEffect(() => {
    onResult(vaultAddress, balance, refetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, vaultAddress])
  return null
}

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

// ─── ShareButton ──────────────────────────────────────────────────────────────

function ShareButton({ weightedAPY }: { weightedAPY: number }) {
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()

  const handleShare = () => {
    const apy = weightedAPY > 0 ? weightedAPY.toFixed(2) : '5+'
    const text = `I'm earning ${apy}% APY on my USDC with EarnButton 🟢\nTry it: https://earnbutton.xyz\nPowered by @yo_protocol on @base`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      addToast('success', 'Share text copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => addToast('error', 'Could not copy to clipboard'))
  }

  return (
    <button type="button" onClick={handleShare}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-teal-400 transition-colors"
      style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
      {copied ? (
        <>
          <svg className="h-3 w-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share EarnButton
        </>
      )}
    </button>
  )
}

// ─── Dashboard (main) ─────────────────────────────────────────────────────────

function DashboardInner({ userAddress, onDeposit, onDepositSuccess }: DashboardProps) {
  const { vaults, isLoading: vaultsLoading } = useYOVaults()
  const { address: walletAddress } = useAccount()

  const [shareMap, setShareMap] = useState<Record<string, { shares: bigint; refetch: () => Promise<void> }>>({})
  const [sharePriceMap, setSharePriceMap] = useState<Record<string, number>>({})
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const handleVaultResult = useCallback(
    (vaultAddress: string, shares: bigint, refetch: () => Promise<void>) => {
      setShareMap((prev) => {
        if (prev[vaultAddress]?.shares === shares) return prev
        return { ...prev, [vaultAddress]: { shares, refetch } }
      })
    }, [])

  const handleSharePriceResult = useCallback((vaultAddress: string, sharePrice: number) => {
    setSharePriceMap((prev) => {
      if (prev[vaultAddress] === sharePrice) return prev
      return { ...prev, [vaultAddress]: sharePrice }
    })
  }, [])

  const positions: VaultPosition[] = vaults
    .filter((v) => (shareMap[v.address]?.shares ?? 0n) > 0n)
    .map((v) => {
      const shares = shareMap[v.address]?.shares ?? 0n
      const vaultConfig = YO_VAULTS.find((c) => c.address.toLowerCase() === v.address.toLowerCase())
      const decimals = vaultConfig?.decimals ?? 6
      const sharePrice = sharePriceMap[v.address] ?? 1
      const sharesFloat = Number(shares) / 10 ** decimals
      const currentValueFloat = sharesFloat * sharePrice
      const currentValue = BigInt(Math.round(currentValueFloat * 10 ** decimals))
      const recorded = walletAddress ? getRecordedDeposit(walletAddress, v.address) : 0n
      const depositedAmount = recorded > 0n ? recorded : shares
      return {
        vaultAddress: v.address, vaultName: v.name, depositedAmount, currentValue,
        shares, apy: v.apy, depositedAt: Math.floor(Date.now() / 1000),
      } satisfies VaultPosition
    })

  const isLoading = vaultsLoading
  const totalDeposited = calculateTotalDeposited(positions)
  const totalValue = calculateTotalValue(positions)
  const yieldEarned = calculateYieldEarned(positions)
  const weightedAPY = calculateWeightedAPY(positions)

  useEffect(() => {
    const id = setInterval(() => {
      Object.values(shareMap).forEach(({ refetch }) => refetch())
      setLastRefreshed(new Date())
    }, REFRESH_INTERVALS.PORTFOLIO_DATA)
    return () => clearInterval(id)
  }, [shareMap])

  const refetchAll = useCallback(() => {
    Object.values(shareMap).forEach(({ refetch }) => refetch())
  }, [shareMap])

  useEffect(() => { onDepositSuccess?.(refetchAll) }, [refetchAll, onDepositSuccess])

  return (
    <div className="space-y-6">
      {vaults.map((v) => (
        <React.Fragment key={v.address}>
          <VaultBalanceLoader userAddress={userAddress} vaultAddress={v.address as `0x${string}`} onResult={handleVaultResult} />
          <VaultSharePriceLoader vaultAddress={v.address} onResult={handleSharePriceResult} />
        </React.Fragment>
      ))}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Deposited" value={`$${formatUSDC(totalDeposited)}`} isLoading={isLoading} />
        <SummaryCard label="Current Value" value={`$${formatUSDC(totalValue)}`} isLoading={isLoading} />
        <SummaryCard
          label="Yield Earned"
          value={`${yieldEarned >= 0n ? '+' : '-'}$${formatUSDC(yieldEarned >= 0n ? yieldEarned : -yieldEarned)}`}
          valueColor={yieldEarned >= 0n ? 'text-teal-400' : 'text-red-400'}
          isLoading={isLoading}
        />
        <SummaryCard label="Weighted APY" value={`${formatAPY(weightedAPY)}`} valueColor="text-teal-400" isLoading={isLoading} />
      </div>

      {/* Positions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-white">Your Positions</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <ShareButton weightedAPY={weightedAPY} />
            <span className="flex items-center gap-1.5 text-xs text-teal-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              Live on Base Mainnet
            </span>
            <span className="text-xs text-gray-600">
              · Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <PositionList positions={positions} isLoading={isLoading} onWithdrawSuccess={refetchAll} onDeposit={onDeposit} />
      </div>

      {/* Recent Activity */}
      {walletAddress && <RecentActivity walletAddress={walletAddress} />}
    </div>
  )
}

const Dashboard = React.memo(DashboardInner)
export default Dashboard
