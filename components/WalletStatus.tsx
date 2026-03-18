'use client'

import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useBalance } from '@/lib/hooks'
import { formatAddress, formatUSDC } from '@/lib/formatting'

export default function WalletStatus() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                         hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          )
        }

        return <ConnectedWallet address={account.address} onOpen={openAccountModal} />
      }}
    </ConnectButton.Custom>
  )
}

function ConnectedWallet({ address, onOpen }: { address: string; onOpen: () => void }) {
  const { balance, isLoading } = useBalance({ token: 'USDC' })
  const IS_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
  // Short address: 0x1234 on mobile, 0x1234…5678 on desktop
  const shortAddress = `${address.slice(0, 6)}`
  const fullAddress = formatAddress(address)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2
                 hover:bg-neutral-50 transition-colors text-sm"
    >
      <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
      {IS_TESTNET && (
        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
          Sepolia
        </span>
      )}
      <span className="font-medium text-neutral-700">
        <span className="sm:hidden">{shortAddress}</span>
        <span className="hidden sm:inline">{fullAddress}</span>
      </span>
      {!isLoading && (
        <span className="hidden sm:inline text-neutral-500 border-l border-neutral-200 pl-2">
          {formatUSDC(balance)} USDC
        </span>
      )}
    </button>
  )
}
