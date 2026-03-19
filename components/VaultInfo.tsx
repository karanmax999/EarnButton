'use client'

import React from 'react'
import { useVaultAPY } from '@/lib/hooks/useVaultAPY'
import { formatAPY } from '@/lib/formatting'
import { YO_VAULTS } from '@/lib/constants'
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

const cardBase: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 20,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 220,
  transition: 'all 300ms cubic-bezier(0.34,1.56,0.64,1)',
}

const VaultInfo: React.FC<VaultInfoProps> = ({ vaultAddress, connectMode = false, onDeposit }) => {
  const config = YO_VAULTS.find((v) => v.address.toLowerCase() === vaultAddress.toLowerCase())
  const { apy, tvlFormatted, isLoading } = useVaultAPY(vaultAddress)

  if (!config) return null

  const accent = getAccent(config.name)

  if (isLoading) {
    return (
      <div
        className="vault-card h-full"
        style={cardBase}
      >
        <div className="vault-accent-bar h-[3px] w-full" style={{ background: accent }} />
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">{config.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{config.description}</p>
            </div>
            <Skeleton width={56} height={22} borderRadius="9999px" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['APY', 'TVL', 'Asset'].map((label) => (
              <div key={label} className="space-y-1.5">
                <p className="text-xs text-gray-600 uppercase tracking-wider">{label}</p>
                <Skeleton width={48} height={24} borderRadius="0.5rem" />
              </div>
            ))}
          </div>
          <div className="mt-auto">
            <Skeleton height={44} borderRadius="0.75rem" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="vault-card h-full"
      style={cardBase}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(0,200,150,0.3)'
        el.style.boxShadow = '0 0 30px rgba(0,200,150,0.06)'
        el.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.boxShadow = 'none'
        el.style.transform = 'none'
      }}
    >
      <div className="vault-accent-bar h-[3px] w-full" style={{ background: accent }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{config.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{config.description}</p>
          </div>
          <span
            className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              background: 'rgba(0,200,150,0.1)',
              color: '#00c896',
              border: '1px solid rgba(0,200,150,0.2)',
            }}
          >
            Low
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-gray-600 uppercase tracking-wider">APY</p>
            <p
              className="apy-value text-2xl font-bold text-teal-400"
              style={{ textShadow: '0 0 20px rgba(0,200,150,0.4)' }}
            >
              {formatAPY(apy)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-600 uppercase tracking-wider">TVL</p>
            <p className="text-base font-semibold text-white">
              ${Number(tvlFormatted).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-600 uppercase tracking-wider">Asset</p>
            <p className="text-base font-medium text-gray-300">{config.asset}</p>
          </div>
        </div>

        {/* Button */}
        <div className="mt-auto">
          {connectMode ? (
            <div
              className="rounded-xl py-3 text-center text-xs font-semibold text-gray-500"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Connect wallet to deposit
            </div>
          ) : onDeposit ? (
            <button
              type="button"
              onClick={onDeposit}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.boxShadow = '0 0 20px rgba(0,200,150,0.3)'
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.boxShadow = 'none'
                el.style.transform = 'none'
              }}
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
