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
import { recordDeposit } from '@/lib/depositStore'
import { useAccount } from 'wagmi'

export interface EarnModalProps {
  isOpen: boolean
  onClose: () => void
  vaultAddress: string
  onSuccess?: () => void
}

type DepositStep = 'input' | 'risk-confirm' | 'approving' | 'depositing' | 'success' | 'error'

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
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-sm font-mono transition-colors">
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
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border-2 transition-all
              ${s.done ? 'border-green-500 bg-green-50 text-green-600' : s.active ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-neutral-200 bg-white text-neutral-400'}`}>
              {s.done ? '✓' : i + 1}
            </span>
            <span className={`text-[10px] font-medium ${s.active ? 'text-primary-600' : s.done ? 'text-green-600' : 'text-neutral-400'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-6 mb-4 transition-colors ${s.done ? 'bg-green-400' : 'bg-neutral-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── RiskConfirmStep ──────────────────────────────────────────────────────────

function RiskConfirmStep({ vaultName, assetSymbol, onConfirm, onCancel }: {
  vaultName: string; assetSymbol: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-900">High-Risk Vault</p>
          <p className="text-sm text-neutral-500 mt-1">
            {vaultName} is rated <span className="font-semibold text-red-600">High Risk</span>. This vault may use leveraged or complex strategies. Only deposit what you can afford to lose.
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 space-y-1">
        <p className="font-semibold">Before you continue:</p>
        <ul className="list-disc list-inside space-y-0.5 text-red-600">
          <li>Smart contract risk — funds could be lost due to bugs</li>
          <li>Liquidation risk — leveraged positions can be liquidated</li>
          <li>Higher APY comes with higher risk of loss</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-xl border border-neutral-300 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
          Go Back
        </button>
        <button type="button" onClick={onConfirm}
          className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
          I understand, deposit {assetSymbol}
        </button>
      </div>
    </div>
  )
}

// ─── InputStep ────────────────────────────────────────────────────────────────

function InputStep({ amountInput, setAmountInput, usdcBalance, balanceLoading, validationError, isAmountValid, onMax, onSubmit, apy, assetSymbol = 'USDC' }: {
  amountInput: string; setAmountInput: (v: string) => void; usdcBalance: bigint; balanceLoading: boolean
  validationError: string | null; isAmountValid: boolean; onMax: () => void; onSubmit: () => void
  apy?: number; assetSymbol?: string
}) {
  const parsedNum = parseFloat(amountInput) || 0
  const borderClass = validationError
    ? 'border-red-400 ring-2 ring-red-100'
    : 'border-neutral-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100'
  const estimatedYearly = apy && parsedNum > 0 ? (parsedNum * apy) / 100 : null
  const estimatedMonthly = estimatedYearly ? estimatedYearly / 12 : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">Available balance</span>
        <button type="button" onClick={onMax} className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors">
          {balanceLoading ? <span className="inline-block h-3 w-14 animate-pulse rounded bg-neutral-300" /> : <span>{formatUSDC(usdcBalance)} {assetSymbol}</span>}
          <span className="text-neutral-400">· Max</span>
        </button>
      </div>
      <div className="space-y-1.5">
        <div className={`flex items-center gap-2 rounded-xl border-2 bg-neutral-50 px-4 py-3 transition-all ${borderClass}`}>
          <input id="deposit-amount" type="number" min="0" step="any" placeholder="0.00" value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Deposit amount" />
          <span className="shrink-0 text-sm font-semibold text-neutral-400">{assetSymbol}</span>
        </div>
        {validationError && (
          <p className="text-xs font-medium text-red-600 flex items-center gap-1" role="alert">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
            {validationError}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {[10, 50, 100, 500].map((amt) => (
          <button key={amt} type="button" onClick={() => setAmountInput(String(amt))}
            className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${parsedNum === amt ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'}`}>
            ${amt}
          </button>
        ))}
      </div>
      {estimatedYearly !== null && isAmountValid && (
        <div className="rounded-xl bg-primary-50 border border-primary-100 px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-primary-700">
            <span className="font-semibold">Estimated yield</span>
            <span className="text-primary-500 ml-1">@ {apy?.toFixed(2)}% APY</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary-700">+${estimatedYearly.toFixed(2)}/yr</p>
            <p className="text-xs text-primary-500">~${estimatedMonthly!.toFixed(2)}/mo</p>
          </div>
        </div>
      )}
      <button type="button" onClick={onSubmit} disabled={!isAmountValid}
        className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-3.5 text-sm font-semibold text-white shadow-medium hover:from-primary-400 hover:to-primary-500 transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
        {isAmountValid ? `Deposit ${parsedNum.toFixed(assetSymbol === 'USDC' || assetSymbol === 'EURC' ? 2 : 6)} ${assetSymbol}` : 'Enter an amount'}
      </button>
      <p className="text-center text-xs text-neutral-400">2-step: approve spend, then deposit</p>
    </div>
  )
}

function TransactionStep({ title, description, txHash }: {
  title: string; description: string; txHash?: string; currentStep: DepositStep
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Spinner />
        </div>
        <p className="text-base font-semibold text-neutral-900">{title}</p>
        <p className="text-sm text-neutral-500">{description}</p>
        {txHash && (
          <div className="mt-1 flex flex-col items-center gap-1">
            <span className="text-xs text-neutral-400">Transaction</span>
            <TxLink hash={txHash} />
          </div>
        )}
      </div>
    </div>
  )
}

function SuccessStep({ txHash, assetSymbol = 'USDC', apy, amountInput, onClose }: {
  txHash?: string
  assetSymbol?: string
  apy?: number
  amountInput?: string
  onClose: () => void
}) {
  const parsedNum = parseFloat(amountInput ?? '0') || 0
  const estimatedYearly = apy && parsedNum > 0 ? (parsedNum * apy) / 100 : null

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      {/* Animated checkmark */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xl font-bold text-neutral-900">Deposit confirmed!</p>
        {apy && parsedNum > 0 ? (
          <p className="text-sm text-neutral-600">
            You&apos;re now earning{' '}
            <span className="font-semibold text-primary-600">{apy.toFixed(2)}% APY</span>
            {' '}on{' '}
            <span className="font-semibold">{parsedNum.toFixed(assetSymbol === 'USDC' || assetSymbol === 'EURC' ? 2 : 6)} {assetSymbol}</span>
          </p>
        ) : (
          <p className="text-sm text-neutral-600">Your {assetSymbol} is now earning yield.</p>
        )}
        {estimatedYearly !== null && (
          <p className="text-xs text-neutral-400">
            ~${estimatedYearly.toFixed(2)} estimated per year
          </p>
        )}
      </div>

      {txHash && (
        <div className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Transaction</span>
          <TxLink hash={txHash} />
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-3.5 text-sm font-semibold text-white hover:from-primary-400 hover:to-primary-500 transition-all"
      >
        View Dashboard
      </button>
    </div>
  )
}

function ErrorStep({ message, onTryAgain }: { message: string | null; onTryAgain: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-neutral-900">Something went wrong</p>
        <p className="text-sm text-red-600">{message ?? 'An unexpected error occurred.'}</p>
      </div>
      <button type="button" onClick={onTryAgain} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
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

  // Check balance of the vault's underlying asset (not always USDC)
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
    if (isNaN(num) || num <= 0) { setValidationError('Amount must be greater than zero'); return }
    const result = validateAmount(parsedAmount, assetBalance)
    setValidationError(result.isValid ? null : (result.error ?? null))
  }, [amountInput, parsedAmount, assetBalance])

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
      // Persist deposited amount so Dashboard can calculate yield
      if (walletAddress) recordDeposit(walletAddress, vaultAddress, parsedAmount)
      setStep('success')
      addToast('success', `Deposit confirmed · ${formatTxHash(depositTxHash)}`)
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDepositing, depositTxHash, step])

  useEffect(() => {
    if (!isOpen) { setStep('input'); setAmountInput(''); setValidationError(null); setErrorMessage(null); setFinalTxHash(undefined); resetDeposit() }
  }, [isOpen, resetDeposit])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) handleClose()
  }, [handleClose])

  const handleMax = useCallback(() => {
    setAmountInput((Number(assetBalance) / 10 ** assetDecimals).toFixed(assetDecimals))
  }, [assetBalance, assetDecimals])

  const proceedWithDeposit = useCallback(async () => {
    try {
      const alreadyApproved = await checkApproval({ vaultAddress: vaultAddress as `0x${string}`, amount: parsedAmount, assetAddress })
      if (alreadyApproved) {
        await handleDeposit()
      } else {
        setStep('approving')
        addToast('info', `Approving ${assetSymbol}… confirm in wallet`)
        await approve({ vaultAddress: vaultAddress as `0x${string}`, amount: parsedAmount, assetAddress })
      }
    } catch { /* handled via depositHookError */ }
  }, [checkApproval, vaultAddress, parsedAmount, handleDeposit, approve, addToast, assetSymbol, assetAddress])

  const handleSubmit = useCallback(async () => {
    if (!isAmountValid) return
    if (vault?.riskLevel === 'High') {
      setStep('risk-confirm')
      return
    }
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
      aria-modal="true" role="dialog" aria-label="Deposit modal">
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* Drag handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-neutral-300" />
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-primary-400 to-primary-600" />
        <div className="flex items-start justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{vault?.name ?? 'Deposit to Vault'}</h2>
            {vault && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-neutral-500">APY</span>
                <span className="text-sm font-bold text-primary-600">{vault.apy.toFixed(2)}%</span>
              </div>
            )}
          </div>
          <button type="button" onClick={handleClose} aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Always-visible step progress */}
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
          )}          {step === 'success' && <SuccessStep txHash={finalTxHash} assetSymbol={assetSymbol} apy={vault?.apy} amountInput={amountInput} onClose={handleClose} />}
          {step === 'error' && <ErrorStep message={errorMessage} onTryAgain={handleTryAgain} />}
        </div>
      </div>
    </div>
  )
}

export default EarnModal
