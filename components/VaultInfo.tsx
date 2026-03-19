'use client'

import React from 'react'
import clsx from 'clsx'
import { useVaultAPY } from '@/lib/hooks/useVaultAPY'
import { formatAPY } from '@/lib/formatting'
import { YO_VAULTS, RISK_COLORS } from '@/lib/constants'
import { Skeleton } from '@/components/ui/Skeleton'

export interface VaultInfoProps {
  vaultAddress: string
  connectMode?: boolean
  onDeposit?: () => void
}

const VAULT_ACCENT: Record<string, string> = {
  yousd: '#00c896',
  yoeth: '#627EEA',
  yobtc: '#F7931A',
  yoeur: '#2775CA',
}

function getAccent(name: string) {
  return VAULT_ACCENT[name.toLowerCase()] ?? '#00c896'
}

const VaultInfo: React.FC<VaultInfoProps> = ({ vaultAddress, connectMode = false, onDeposit }) => {
  const config = YO_VAULTS.find((v) => v.address.toLowerCase() === vaultAddress.toLowerCase())
  const { apy, tvlFormatted, isLoading } = useVaultAPY(vaultAddress)

  if (!config) return null

  const accent = getAccent(config.name)

  if (isLoading) {
    return (
      <div className="vault-card rounded-2xl border border-neutral-200 bg-white shadow-soft overflow-hidden flex flex-col min-h-[220px]">
        <div className="vault-accent-bar h-[3px] w-full" style={{ background: accent }} />
        <div className="p-5 space-y-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">{config.name}</h3>
              <p className="text-xs text-neutral-500 mt-0.5 truncate">{config.description}</p>
            </div>
            <Skeleton width={56} height={22} borderRadius="9999px" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">APY</p>
              <Skeleton width={48} height={28} borderRadius="0.5rem" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">TVL</p>
              <Skeleton width={60} height={22} borderRadius="0.5rem" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Asset</p>
              <p className="text-base font-semibold text-neutral-800">{config.asset}</p>
            </div>
          </div>
          <div className="mt-auto">
            <Skeleton height={38} borderRadius="0.75rem" />
          </div>
        </div>
      </div>
    )
  }

  const riskLevel = 'Low' as const

  return (
    <div className="vault-card rounded-2xl border border-neutral-200 bg-white shadow-soft overflow-hidden flex flex-col min-h-[220px]">
      <div className="vault-accent-bar h-[3px] w-full" style={{ background: accent }} />
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-neutral-900">{config.name}</h3>
            <p className="text-xs text-neutral-500 mt-0.5 truncate">{config.description}</p>
          </div>
          <span className={clsx('shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', RISK_COLORS[riskLevel])}>
            {riskLevel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">APY</p>
            <p className="apy-value text-2xl font-bold text-primary-600">{formatAPY(apy)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">TVL</p>
            <p className="text-base font-semibold text-neutral-800">
              ${Number(tvlFormatted).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">Asset</p>
            <p className="text-base font-semibold text-neutral-800">{config.asset}</p>
          </div>
        </div>

        <div className="mt-auto">
          {connectMode ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 text-center text-xs font-semibold text-neutral-400">
              Connect wallet to deposit
            </div>
          ) : onDeposit ? (
            <button
              type="button"
              onClick={onDeposit}
              className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-2.5 text-sm font-semibold text-white hover:from-primary-400 hover:to-primary-500 transition-all"
            >
              Deposit {config.asset}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default VaultInfo
