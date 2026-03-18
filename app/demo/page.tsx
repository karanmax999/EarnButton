'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import EarnModal from '@/components/EarnModal'
import { YO_VAULTS } from '@/lib/constants'

// ─── Mock data ────────────────────────────────────────────────────────────────

const ASSETS = [
  { symbol: 'ETH', amount: '0.842 ETH', value: '$2,121.44', color: '#627EEA' },
  { symbol: 'USDC', amount: '329.39 USDC', value: '$329.39', color: '#2775CA' },
]

const TXS = [
  { label: 'Received ETH', amount: '+0.1 ETH', time: '2h ago', positive: true },
  { label: 'Sent USDC', amount: '-50.00', time: 'Yesterday', positive: false },
  { label: 'Swap ETH→USDC', amount: '+329.39', time: '3 days ago', positive: true },
]

const STEPS = [
  {
    n: '1',
    title: 'Install',
    lang: 'bash',
    code: 'npm install @earnbutton/react',
  },
  {
    n: '2',
    title: 'Import',
    lang: 'tsx',
    code: "import { EarnButton } from '@earnbutton/react'",
  },
  {
    n: '3',
    title: 'Drop in',
    lang: 'tsx',
    code: `export default function MyWallet() {
  return (
    <div>
      <WalletBalance />
      <EarnButton
        vaultId="yoUSD"
        theme="green"
      />
    </div>
  )
}`,
  },
]

const BENEFITS = [
  { icon: '✓', text: '2 hours to integrate' },
  { icon: '✓', text: 'No smart contract work' },
  { icon: '✓', text: 'Inherited security' },
  { icon: '✓', text: 'Automated rebalancing' },
]

const WHY = [
  {
    title: 'Keep users in your app',
    desc: 'Users never leave to find yield elsewhere. Embed the full earn experience natively.',
  },
  {
    title: 'Zero engineering overhead',
    desc: 'No smart contracts, no audits, no maintenance. We handle the protocol layer.',
  },
  {
    title: 'Share in the upside',
    desc: 'Revenue share on TVL your users bring. The more they earn, the more you earn.',
  },
]

// ─── Code block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Simple keyword highlight — wraps known keywords in a span
  const keywords = ['import', 'from', 'export', 'default', 'function', 'return', 'const', 'npm', 'install']
  const highlighted = code.split(/(\s+|[<>/{}()\[\]"'`=,\n])/).map((token, i) => {
    if (keywords.includes(token)) {
      return <span key={i} style={{ color: '#7ee84a' }}>{token}</span>
    }
    if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      return <span key={i} style={{ color: '#ffd700' }}>{token}</span>
    }
    return <span key={i} style={{ color: '#c9d1d9' }}>{token}</span>
  })

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: '#1a1a2e' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-white/40 font-mono">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs text-white/40 hover:text-white/80 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-sm font-mono overflow-x-auto leading-relaxed">
        <code>{highlighted}</code>
      </pre>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Top banner */}
      <div className="bg-teal-500 px-4 py-3 text-center text-sm text-white font-medium">
        <span>🔌 Developer Demo — Any crypto app can embed EarnButton in one afternoon. This is a live demo.</span>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="EarnButton" width={140} height={32} priority />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-teal-600 transition-colors"
          >
            ← Back to EarnButton
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-neutral-900">Embed EarnButton in your app</h1>
          <p className="mt-2 text-neutral-500">See how a real crypto wallet integrates yield — then grab the code.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* LEFT — Mock wallet */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            {/* Wallet header */}
            <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white text-lg font-black">
                ₿
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">CryptoWallet Pro</p>
                <p className="text-xs text-neutral-400">0x1a2b…9f3c</p>
              </div>
              <span className="ml-auto rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                ● Connected
              </span>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Balance */}
              <div className="text-center py-2">
                <p className="text-4xl font-black text-neutral-900">$2,450.83</p>
                <p className="mt-1 text-sm text-neutral-400">Total Portfolio</p>
              </div>

              {/* Assets */}
              <div className="space-y-2">
                {ASSETS.map((a) => (
                  <div key={a.symbol} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: a.color }}
                      >
                        {a.symbol[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{a.symbol}</p>
                        <p className="text-xs text-neutral-400">{a.amount}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">{a.value}</p>
                  </div>
                ))}
              </div>

              {/* Transactions */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Recent</p>
                <div className="space-y-1">
                  {TXS.map((tx) => (
                    <div key={tx.label} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                      <div>
                        <p className="text-sm text-neutral-800">{tx.label}</p>
                        <p className="text-xs text-neutral-400">{tx.time}</p>
                      </div>
                      <span className={`text-sm font-semibold ${tx.positive ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earn button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full rounded-xl bg-green-500 py-3.5 text-sm font-bold text-white hover:bg-green-400 transition-colors shadow-sm"
                >
                  ⚡ Earn Yield
                </button>
                <p className="mt-2 text-center text-xs text-neutral-400">
                  Earning 5.27% APY on your idle USDC · Powered by YO Protocol
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Integration code */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-neutral-100 px-6 py-4">
              <p className="text-sm font-bold text-neutral-900">Add to your app in 3 steps</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {STEPS.map((s) => (
                <div key={s.n}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                      {s.n}
                    </span>
                    <span className="text-sm font-semibold text-neutral-700">{s.title}</span>
                  </div>
                  <CodeBlock code={s.code} lang={s.lang} />
                </div>
              ))}

              {/* Benefit pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {BENEFITS.map((b) => (
                  <span
                    key={b.text}
                    className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                  >
                    {b.icon} {b.text}
                  </span>
                ))}
              </div>

              {/* Coming soon note */}
              <p className="text-xs text-neutral-400 leading-relaxed">
                The <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-neutral-600">@earnbutton/react</code> package is coming soon. This demo shows the integration experience.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Why section */}
      <section className="mt-4 bg-neutral-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-black text-neutral-900">Why embed EarnButton?</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-base font-bold text-neutral-900">{w.title}</h3>
                <p className="text-sm text-neutral-500">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0f1e] px-4 py-8 text-center text-xs text-white/30">
        <p>EarnButton · Powered by YO Protocol · Built on Base</p>
        <p className="mt-1">Not financial advice. DeFi involves risk. Always DYOR.</p>
      </footer>

      {/* Real EarnModal */}
      <EarnModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        vaultAddress={YO_VAULTS[0].address}
        onSuccess={() => setModalOpen(false)}
      />
    </div>
  )
}