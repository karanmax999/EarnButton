'use client'

import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatedGradientBackground } from '@/components/ui/animated-gradient-background'

interface CTASectionProps {
  isConnected: boolean
  onOpenModal: () => void
}

const STATS = [
  { value: '$44M+', label: 'Total Value Locked' },
  { value: '5.29%', label: 'Top APY Today' },
  { value: '4', label: 'Active Vaults' },
]

export default function CTASection({ isConnected, onOpenModal }: CTASectionProps) {
  return (
    <>
      {/* CTA */}
      <section className="relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center px-4 py-24">
        {/* Animated gradient background */}
        <AnimatedGradientBackground
          Breathing={true}
          breathingRange={8}
          animationSpeed={0.015}
          gradientColors={['#050d1a', '#003d2e', '#005a42', '#007a58', '#00c896', '#0a0f1e', '#050d1a']}
          gradientStops={[30, 45, 58, 68, 78, 90, 100]}
          topOffset={10}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-2xl space-y-6">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span className="font-mono text-xs tracking-widest text-teal-400 uppercase">
              ★ Live on Base Mainnet
            </span>
          </div>

          {/* Headline */}
          <h2
            className="text-5xl sm:text-6xl font-black text-white"
            style={{ textShadow: '0 0 60px rgba(0,200,150,0.3)' }}
          >
            Ready to earn?
          </h2>

          {/* Subheadline */}
          <p className="text-gray-300 text-lg max-w-md mx-auto">
            Join thousands earning real yield on Base. Start in 30 seconds.
          </p>

          {/* Stat cards */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="stat-glass-card px-6 py-4 rounded-xl text-center"
                style={{
                  background: 'rgba(0,200,150,0.06)',
                  border: '1px solid rgba(0,200,150,0.15)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 300ms',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(0,200,150,0.4)'
                  el.style.boxShadow = '0 0 20px rgba(0,200,150,0.1)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(0,200,150,0.15)'
                  el.style.boxShadow = 'none'
                }}
              >
                <p className="text-2xl font-bold text-teal-400">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Main button */}
          {isConnected ? (
            <button
              type="button"
              onClick={onOpenModal}
              className="inline-flex items-center gap-2 px-10 py-4 text-lg font-bold text-white rounded-[14px] transition-all duration-[250ms]"
              style={{
                background: 'linear-gradient(135deg, #00c896, #00a07a)',
                boxShadow: '0 0 40px rgba(0,200,150,0.3)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.boxShadow = '0 0 60px rgba(0,200,150,0.5)'
                el.style.transform = 'translateY(-2px) scale(1.02)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.boxShadow = '0 0 40px rgba(0,200,150,0.3)'
                el.style.transform = 'none'
              }}
            >
              Start Earning Now →
            </button>
          ) : (
            <ConnectButton label="Start Earning Now →" />
          )}

          {/* Support row */}
          <div className="pt-4 space-y-3">
            <p className="font-mono text-xs text-gray-500 tracking-widest uppercase">Support EarnButton</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://x.com/earnbutton"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                𝕏 Follow @earnbutton
              </a>
              <a
                href="https://dorahacks.io/buidl/40852"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-teal-400 hover:bg-teal-500 hover:text-white transition-colors"
                style={{
                  background: 'rgba(0,200,150,0.15)',
                  border: '1px solid rgba(0,200,150,0.3)',
                }}
              >
                ⬆ Upvote on DoraHacks
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer
        className="px-6 pt-12 pb-0"
        style={{
          background: 'rgba(5,13,26,0.97)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10">
            {/* Left — brand */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Image src="/logo.svg" alt="EarnButton" width={120} height={28} />
              </div>
              <p className="text-gray-500 text-sm">One-tap DeFi yield</p>
              <p className="text-gray-600 text-xs">Powered by YO Protocol · Built on Base</p>
            </div>

            {/* Center — links */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {[
                  { label: 'yo.xyz', href: 'https://yo.xyz' },
                  { label: 'Docs', href: 'https://docs.yo.xyz' },
                  { label: 'yoUSD on Basescan ↗', href: 'https://basescan.org/address/0x0000000f2eb9f69274678c76222b35eec7588a65' },
                ].map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {[
                  { label: 'Twitter / X', href: 'https://x.com/earnbutton' },
                  { label: 'DoraHacks ↗', href: 'https://dorahacks.io/buidl/40852' },
                ].map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                ))}
                <Link href="/demo" className="text-gray-400 text-sm hover:text-white transition-colors">
                  For Developers
                </Link>
              </div>
            </div>

            {/* Right — live status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="text-green-400 text-sm">Live on Base Mainnet</span>
              </div>
              <p className="text-gray-600 text-xs">Secured by YO Protocol vaults</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="py-4 text-center">
            <p className="text-gray-600 text-xs">
              EarnButton · Not financial advice. DeFi involves risk. Always DYOR.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
