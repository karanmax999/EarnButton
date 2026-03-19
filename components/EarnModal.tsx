'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useBalance } from '@/lib/hooks'
import { useDeposit } from '@/lib/hooks/useDeposit'
import { formatUSDC, formatTxHash } from '@/lib/formatting'
import { validateAmount } from '@/lib/validation'
import { sanitizeInput } from '@/lib/security'
import { BLOCK_EXPLORER, YO_VAULTS, CONTRACTS } from '@/lib/constants'
import { useYOVaults } from '@/lib/hooks/useYOVaults'
import { useToast } from '@/components/Toast'
import { recordDeposit, addActivityRecord } from '@/lib/depositStore'
import { useAccount } from 'wagmi'

export interface EarnModalProps {
  isOpen: boolean
  onClose: () => void
  vaultAddress: string
  onSuccess?: () => void
}

type DepositStep = 'input' | 'risk-confirm' | 'approving' | 'depositing' | 'success' | 'error'

const MODAL_BG = '#0d1421'
const CARD_BG = '#111827'
const INPUT_BG = '#1a2332'
const BORDER = 'rgba(255,255,255,0.08)'
const BORDER_ACTIVE = 'rgba(0,200,150,0.4)'

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a href={`${BLOCK_EXPLORER.BASE}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 underline text-sm font-mono transition-colors">
      {formatTxHash(hash)}
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

function StepIndicator({ currentStep }: { currentStep: DepositStep }) {
  const steps = [
    { label: 'Amount', active: currentStep === 'input', done: ['risk-confirm','approving','depositing','success'].includes(currentStep) },
    { label: 'Approve', active: currentStep === 'approving', done: ['depositing','success'].includes(currentStep) },
    { label: 'Deposit', active: currentStep === 'depositing', done: currentStep === 'success' },
    { label: 'Done', active: currentStep === 'success', done: false },
  ]
  return (
    <div className="flex items-center justify-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className="flex flex-col items-center gap-1">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border-2 transition-all`}
              style={{
                borderColor: s.done ? '#00c896' : s.active ? '#00c896' : 'rgba(255,255,255,0.1)',
                background: s.done ? 'rgba(0,200,150,0.15)' : s.active ? 'rgba(0,200,150,0.1)' : 'transparent',
                color: s.done ? '#00c896' : s.active ? '#00c896' : 'rgba(255,255,255,0.3)',
              }}>
              {s.done ? '✓' : i + 1}
            </span>
            <span className="text-[10px] font-medium" style={{ color: s.active || s.done ? '#00c896' : 'rgba(255,255,255,0.3)' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="h-px w-6 mb-4 transition-colors" style={{ background: s.done ? '#00c896' : 'rgba(255,255,255,0.08)' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function RiskConfirmStep({ vaultName, assetSymbol, onConfirm, onCancel }: {
  vaultName: string; assetSymbol: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-white">High-Risk Vault</p>
          <p className="text-sm text-gray-400 mt-1">
            {vaultName} is rated <span className="font-semibold text-red-400">High Risk</span>. Only deposit what you can afford to lose.
          </p>
        </div>
      </div>
      <div className="rounded-xl px-4 py-3 text-xs space-y-1" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <p className="font-semibold text-red-400">Before you continue:</p>
        <ul className="list-disc list-inside space-y-0.5 text-red-400/80">
          <li>Smart contract risk — funds could be lost due to bugs</li>
          <li>Liquidation risk — leveraged positions can be liquidated</li>
          <li>Higher APY comes with higher risk of loss</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          Go Back
        </button>
        <button type="button" onClick={onConfirm}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          I understand, deposit {assetSymbol}
        </button>
      </div>
    </div>
  )
}

function InputStep({ amountInput, setAmountInput, usdcBalance, balanceLoading, validationError, isAmountValid, onMax, onSubmit, apy, assetSymbol = 'USDC' }: {
  amountInput: string; setAmountInput: (v: string) => void; usdcBalance: bigint; balanceLoading: boolean
  validationError: string | null; isAmountValid: boolean; onMax: () => void; onSubmit: () => void
  apy?: number; assetSymbol?: string
}) {
  const parsedNum = parseFloat(amountInput) || 0
  const estimatedYearly = apy && parsedNum > 0 ? (parsedNum * apy) / 100 : null
  const estimatedMonthly = estimatedYearly ? estimatedYearly / 12 : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Available balance</span>
        <button type="button" onClick={onMax}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-400 hover:text-teal-400 transition-colors"
          style={{ background: INPUT_BG, border: `1px solid ${BORDER}` }}>
          {balanceLoading
            ? <span className="inline-block h-3 w-14 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
            : <span>{formatUSDC(usdcBalance)} {assetSymbol}</span>}
          <span className="text-gray-600">· Max</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all"
          style={{ background: INPUT_BG, border: `1px solid ${validationError ? 'rgba(239,68,68,0.5)' : BORDER}` }}
          onFocusCapture={(e) => { if (!validationError) (e.currentTarget as HTMLDivElement).style.borderColor = BORDER_ACTIVE }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = validationError ? 'rgba(239,68,68,0.5)' : BORDER }}>
          <input id="deposit-amount" type="number" min="0" step="any" placeholder="0.00" value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-gray-700
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Deposit amount" />
          <span className="shrink-0 text-sm font-semibold text-gray-500">{assetSymbol}</span>
        </div>
        {validationError && (
          <p className="text-xs font-medium text-red-400 flex items-center gap-1" role="alert">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
            {validationError}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {[10, 50, 100, 500].map((amt) => {
          const isActive = parsedNum === amt
          return (
            <button key={amt} type="button" onClick={() => setAmountInput(String(amt))}
              className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all"
              style={{
                background: isActive ? 'rgba(0,200,150,0.15)' : INPUT_BG,
                border: `1px solid ${isActive ? 'rgba(0,200,150,0.4)' : BORDER}`,
                color: isActive ? '#2dd4bf' : 'rgba(156,163,175,1)',
              }}>
              ${amt}
            </button>
          )
        })}
      </div>

      {estimatedYearly !== null && isAmountValid && (
        <div className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.15)' }}>
          <div className="text-xs text-teal-400">
            <span className="font-semibold">Estimated yield</span>
            <span className="text-teal-500/70 ml-1">@ {apy?.toFixed(2)}% APY</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-teal-400">+${estimatedYearly.toFixed(2)}/yr</p>
            <p className="text-xs text-teal-500/70">~${estimatedMonthly!.toFixed(2)}/mo</p>
          </div>
        </div>
      )}

      <button type="button" onClick={onSubmit} disabled={!isAmountValid}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: isAmountValid ? 'linear-gradient(135deg, #00c896, #00a07a)' : 'rgba(255,255,255,0.06)' }}>
        {isAmountValid ? `Deposit ${parsedNum.toFixed(assetSymbol === 'USDC' || assetSymbol === 'EURC' ? 2 : 6)} ${assetSymbol}` : 'Enter an amount'}
      </button>
      <p className="text-center text-xs text-gray-600">2-step: approve spend, then deposit</p>
    </div>
  )
}

function TransactionStep({ title, description, txHash }: {
  title: string; description: string; txHash?: string; currentStep: DepositStep
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full text-teal-400"
          style={{ background: 'rgba(0,200,150,0.1)' }}>
          <Spinner />
        </div>
        <p className="text-base font-semibold text-white">{title}</p>
        <p className="text-sm text-gray-400">{description}</p>
        {txHash ? (
          <div className="w-full rounded-xl px-4 py-3 space-y-2"
            style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.15)' }}>
            <p className="text-xs font-medium text-teal-400">Transaction submitted — waiting for confirmation...</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xs text-gray-500">View on Basescan</span>
              <TxLink hash={txHash} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-600">Waiting for wallet confirmation...</p>
        )}
      </div>
    </div>
  )
}

function SuccessStep({ txHash, assetSymbol = 'USDC', apy, amountInput, onClose }: {
  txHash?: string; assetSymbol?: string; apy?: number; amountInput?: string; onClose: () => void
}) {
  const parsedNum = parseFloat(amountInput ?? '0') || 0
  const estimatedYearly = apy && parsedNum > 0 ? (parsedNum * apy) / 100 : null

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'rgba(0,200,150,0.3)' }} />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'rgba(0,200,150,0.15)' }}>
          <svg className="h-10 w-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xl font-bold text-white">Deposit confirmed!</p>
        {apy && parsedNum > 0 ? (
          <p className="text-sm text-gray-400">
            You&apos;re now earning{' '}
            <span className="font-semibold text-teal-400">{apy.toFixed(2)}% APY</span>
            {' '}on{' '}
            <span className="font-semibold text-white">{parsedNum.toFixed(assetSymbol === 'USDC' || assetSymbol === 'EURC' ? 2 : 6)} {assetSymbol}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-400">Your {assetSymbol} is now earning yield.</p>
        )}
        {estimatedYearly !== null && (
          <p className="text-xs text-gray-600">~${estimatedYearly.toFixed(2)} estimated per year</p>
        )}
      </div>
      {txHash && (
        <div className="w-full rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
          <span className="text-xs text-gray-500">Transaction</span>
          <TxLink hash={txHash} />
        </div>
      )}
      <button type="button" onClick={onClose}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all"
        style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
        View Dashboard
      </button>
    </div>
  )
}

function ErrorStep({ message, onTryAgain }: { message: string | null; onTryAgain: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(239,68,68,0.1)' }}>
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-white">Something went wrong</p>
        <p className="text-sm text-red-400">{message ?? 'An unexpected error occurred.'}</p>
      </div>
      <button type="button" onClick={onTryAgain}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors"
        style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
        Try Again
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const EarnModal: React.FC<EarnModalProps> = ({ isOpen, onClose, vaultAddress, onSuccess }) => {
  const [step, setStep] = useState<DepositStep>('input')
  const [amountInput, setAmountInput] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [finalTxHash, setFinalTxHash] = useState<string | undefined>()

  const overlayRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()
  const { address: walletAddress } = useAccount()
  const { approve, deposit, checkApproval, isApproving, isDepositing, approvalTxHash, depositTxHash, error: depositHookError, reset: resetDeposit } = useDeposit()
  const { vaults } = useYOVaults()
  const vault = vaults.find((v) => v.address.toLowerCase() === vaultAddress.toLowerCase())

  const vaultConfig = YO_VAULTS.find((v) => v.address.toLowerCase() === vaultAddress.toLowerCase())
  const assetAddress = vaultConfig?.assetAddress
  const assetSymbol = vaultConfig?.asset ?? 'USDC'
  const assetDecimals = vaultConfig?.decimals ?? 6

  const { balance: assetBalance, isLoading: balanceLoading } = useBalance({
    token: 'custom',
    customTokenAddress: assetAddress ?? CONTRACTS.USDC,
    customDecimals: assetDecimals,
  })

  const parsedAmount: bigint = (() => {
    const sanitized = sanitizeInput(amountInput.trim())
    const num = parseFloat(sanitized)
    if (isNaN(num) || num <= 0) return 0n
    return BigInt(Math.round(num * 10 ** assetDecimals))
  })()

  const isAmountValid = parsedAmount > 0n && parsedAmount <= assetBalance

  useEffect(() => {
    if (!amountInput) { setValidationError(null); return }
    const sanitized = sanitizeInput(amountInput.trim())
    const num = parseFloat(sanitized)
    if (isNaN(num) || num <= 0) { setValidationError('Please enter an amount greater than 0'); return }
    const result = validateAmount(parsedAmount, assetBalance)
    if (!result.isValid) {
      const available = (Number(assetBalance) / 10 ** assetDecimals).toFixed(assetDecimals === 6 ? 2 : 6)
      setValidationError(
        result.error?.toLowerCase().includes('insufficient') || result.error?.toLowerCase().includes('exceed')
          ? `Insufficient balance. You have ${available} ${assetSymbol} available.`
          : (result.error ?? null)
      )
    } else { setValidationError(null) }
  }, [amountInput, parsedAmount, assetBalance, assetDecimals, assetSymbol])

  useEffect(() => {
    if (!depositHookError) return
    const msg = depositHookError.message ?? ''
    const isRejected = msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied') || msg.toLowerCase().includes('rejected the request')
    const displayMsg = isRejected ? 'Transaction rejected by user' : (msg || 'An unexpected error occurred')
    setErrorMessage(displayMsg)
    addToast('error', isRejected ? 'Transaction rejected' : (msg || 'Deposit failed'))
    setStep('error')
  }, [depositHookError, addToast])

  const handleDeposit = useCallback(async () => {
    setStep('depositing')
    addToast('info', `Depositing ${assetSymbol}… confirm in wallet`)
    await deposit({ vaultAddress: vaultAddress as `0x${string}`, amount: parsedAmount, assetAddress })
  }, [deposit, vaultAddress, parsedAmount, assetAddress, addToast, assetSymbol])

  useEffect(() => {
    if (step !== 'approving') return
    if (!isApproving && approvalTxHash) handleDeposit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproving, approvalTxHash, step])

  useEffect(() => {
    if (step !== 'depositing') return
    if (!isDepositing && depositTxHash) {
      setFinalTxHash(depositTxHash)
      if (walletAddress) {
        recordDeposit(walletAddress, vaultAddress, parsedAmount)
        const vaultCfg = YO_VAULTS.find((v) => v.address.toLowerCase() === vaultAddress.toLowerCase())
        const humanAmount = (Number(parsedAmount) / 10 ** (vaultCfg?.decimals ?? 6)).toFixed(2)
        addActivityRecord(walletAddress, {
          type: 'deposit', vaultName: vaultCfg?.name ?? 'Vault', vaultAddress,
          amount: humanAmount, txHash: depositTxHash,
          basescanUrl: `${BLOCK_EXPLORER.BASE}/tx/${depositTxHash}`, timestamp: Date.now(),
        })
      }
      setStep('success')
      addToast('success', `Deposit confirmed · ${formatTxHash(depositTxHash)}`)
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDepositing, depositTxHash, step])

  useEffect(() => {
    if (!isOpen) { setStep('input'); setAmountInput(''); setValidationError(null); setErrorMessage(null); setFinalTxHash(undefined); resetDeposit() }
  }, [isOpen, resetDeposit])

  const handleClose = useCallback(() => { onClose() }, [onClose])
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) handleClose()
  }, [handleClose])
  const handleMax = useCallback(() => {
    setAmountInput((Number(assetBalance) / 10 ** assetDecimals).toFixed(assetDecimals))
  }, [assetBalance, assetDecimals])

  const proceedWithDeposit = useCallback(async () => {
    try {
      const alreadyApproved = await checkApproval({ vaultAddress: vaultAddress as `0x${string}`, amount: parsedAmount, assetAddress })
      if (alreadyApproved) { await handleDeposit() }
      else {
        setStep('approving')
        addToast('info', `Approving ${assetSymbol}… confirm in wallet`)
        await approve({ vaultAddress: vaultAddress as `0x${string}`, amount: parsedAmount, assetAddress })
      }
    } catch { /* handled via depositHookError */ }
  }, [checkApproval, vaultAddress, parsedAmount, handleDeposit, approve, addToast, assetSymbol, assetAddress])

  const handleSubmit = useCallback(async () => {
    if (!isAmountValid) return
    if (vault?.riskLevel === 'High') { setStep('risk-confirm'); return }
    await proceedWithDeposit()
  }, [isAmountValid, vault, proceedWithDeposit])

  const handleTryAgain = useCallback(() => { setStep('input'); setErrorMessage(null); resetDeposit() }, [resetDeposit])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <div ref={overlayRef} onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      aria-modal="true" role="dialog" aria-label="Deposit modal">
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: MODAL_BG, border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        {/* Teal accent bar */}
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(to right, #00c896, #00a07a)' }} />
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-base font-semibold text-white">{vault?.name ?? 'Deposit to Vault'}</h2>
            {vault && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">APY</span>
                <span className="text-sm font-bold text-teal-400">{vault.apy.toFixed(2)}%</span>
              </div>
            )}
          </div>
          <button type="button" onClick={handleClose} aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {step !== 'error' && <StepIndicator currentStep={step} />}
          {step === 'input' && (
            <InputStep amountInput={amountInput} setAmountInput={setAmountInput} usdcBalance={assetBalance}
              balanceLoading={balanceLoading} validationError={validationError} isAmountValid={isAmountValid}
              onMax={handleMax} onSubmit={handleSubmit} apy={vault?.apy} assetSymbol={assetSymbol} />
          )}
          {step === 'risk-confirm' && (
            <RiskConfirmStep vaultName={vault?.name ?? 'this vault'} assetSymbol={assetSymbol}
              onConfirm={proceedWithDeposit} onCancel={() => setStep('input')} />
          )}
          {step === 'approving' && (
            <TransactionStep title={`Approving ${assetSymbol}...`} description="Confirm the approval in your wallet." txHash={approvalTxHash} currentStep={step} />
          )}
          {step === 'depositing' && (
            <TransactionStep title={`Depositing ${assetSymbol}...`} description="Confirm the deposit in your wallet." txHash={depositTxHash} currentStep={step} />
          )}
          {step === 'success' && <SuccessStep txHash={finalTxHash} assetSymbol={assetSymbol} apy={vault?.apy} amountInput={amountInput} onClose={handleClose} />}
          {step === 'error' && <ErrorStep message={errorMessage} onTryAgain={handleTryAgain} />}
        </div>
      </div>
    </div>
  )
}

export default EarnModal
