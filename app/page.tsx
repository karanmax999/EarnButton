'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import VaultInfo from '@/components/VaultInfo'
import Dashboard from '@/components/Dashboard'
import EarnModal from '@/components/EarnModal'
import YieldCalculator from '@/components/YieldCalculator'
import { Marquee } from '@/components/ui/Marquee'
import AIAdvisor from '@/components/AIAdvisor'
import { YO_VAULTS } from '@/lib/constants'
import { useYOVaults } from '@/lib/hooks/useYOVaults'

type CurrentView = 'home' | 'dashboard'

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-fade-left, .scroll-fade-up, .scroll-fade-right')
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

function useTVLCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0)
  const triggered = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            setValue(Math.round(target * eased))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          obs.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, duration])
  return { value, ref }
}

export default function Home() {
  const { isConnected, address } = useAccount()
  const [currentView, setCurrentView] = useState<CurrentView>('home')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVault, setSelectedVault] = useState(YO_VAULTS[0].address)
  const [refetchDashboard, setRefetchDashboard] = useState<(() => void) | null>(null)
  const { vaults } = useYOVaults()

  const apyMap: Record<string, number> = {}
  vaults.forEach((v) => { apyMap[v.address.toLowerCase()] = v.apy })

  useEffect(() => {
    if (isConnected) setCurrentView('dashboard')
    else setCurrentView('home')
  }, [isConnected])

  const openModal = useCallback((vaultAddress: string) => {
    setSelectedVault(vaultAddress as `0x${string}`)
    setModalOpen(true)
  }, [])

  const handleModalSuccess = useCallback(() => {
    setModalOpen(false)
    if (isConnected) setCurrentView('dashboard')
    refetchDashboard?.()
  }, [isConnected, refetchDashboard])

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1e]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="EarnButton home"
            >
              <Image src="/logo.svg" alt="EarnButton" width={160} height={36} priority />
            </button>
            {isConnected && (
              <nav className="hidden sm:flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('home')}
                  className={`text-sm font-medium transition-colors pb-0.5 border-b-2 ${currentView === 'home' ? 'text-teal-400 border-teal-400' : 'text-white/60 border-transparent hover:text-white'}`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('dashboard')}
                  className={`text-sm font-medium transition-colors pb-0.5 border-b-2 ${currentView === 'dashboard' ? 'text-teal-400 border-teal-400' : 'text-white/60 border-transparent hover:text-white'}`}
                >
                  Dashboard
                </button>
              </nav>
            )}
          </div>
          <ConnectButton />
        </div>
      </header>

      {isConnected && currentView === 'dashboard' ? (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Dashboard
            userAddress={address!}
            onDeposit={() => openModal(YO_VAULTS[0].address)}
            onDepositSuccess={(refetch) => setRefetchDashboard(() => refetch)}
          />
        </div>
      ) : (
        <LandingPage
          isConnected={isConnected}
          onOpenModal={openModal}
          apyMap={apyMap}
        />
      )}

      <EarnModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        vaultAddress={selectedVault}
        onSuccess={handleModalSuccess}
      />

      <AIAdvisor />
    </div>
  )
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

interface LandingPageProps {
  isConnected: boolean
  onOpenModal: (vaultAddress: string) => void
  apyMap: Record<string, number>
}

function LandingPage({ isConnected, onOpenModal, apyMap }: LandingPageProps) {
  useScrollReveal()
  const { value: tvlValue, ref: tvlRef } = useTVLCountUp(44)

  const marqueeRow1 = [
    'How do I earn yield on USDC?',
    'Is DeFi yield safe?',
    'What is yoUSD?',
    'How does YO Protocol work?',
    'Can I withdraw anytime?',
    'What APY can I expect?',
  ]
  const marqueeRow2 = [
    'Is my USDC insured?',
    'What is a vault share?',
    'How is APY calculated?',
    'What chains does YO support?',
    'Can I earn on ETH?',
    'What is the minimum deposit?',
  ]

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-[#0a0f1e] px-4 py-20 sm:py-28 text-center"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      >
        <div className="relative mx-auto max-w-3xl">
          <h1 className="animate-fade-up text-4xl sm:text-6xl font-black text-white leading-tight" style={{ animationDelay: '0ms' }}>
            The smartest savings<br />
            <span className="text-teal-400">account in DeFi.</span>
          </h1>
          <p className="animate-fade-up mt-5 text-lg text-white/60 max-w-xl mx-auto" style={{ animationDelay: '150ms' }}>
            Earn 5-9% APY on USDC, ETH, BTC, and EUR. One tap. No complexity. Powered by YO Protocol on Base.
          </p>
          <div className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/50" style={{ animationDelay: '300ms' }}>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live on Base Mainnet
            </span>
            <span>·</span>
            <span>$<span ref={tvlRef}>{tvlValue}</span>M+ TVL</span>
            <span>·</span>
            <span>Non-custodial</span>
            <span>·</span>
            <span>Audited</span>
          </div>
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '450ms' }}>
            {isConnected ? (
              <button
                type="button"
                onClick={() => onOpenModal(YO_VAULTS[0].address)}
                className="rounded-xl bg-teal-500 px-7 py-3.5 text-sm font-bold text-white hover:bg-teal-400 transition-colors shadow-lg"
              >
                Earn with YO
              </button>
            ) : (
              <ConnectButton label="Earn with YO" />
            )}
            <a href="#vaults" className="rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/80 hover:border-white/40 hover:text-white transition-colors">
              View Vaults
            </a>
          </div>
        </div>
      </section>

      {/* Yield Calculator */}
      <section className="bg-neutral-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-lg">
          <YieldCalculator apyMap={apyMap} />
        </div>
      </section>

      {/* Vaults */}
      <section id="vaults" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-neutral-900">Choose your vault</h2>
            <p className="mt-2 text-neutral-500">Four assets. Real yield. All on Base.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {YO_VAULTS.map((vault, i) => (
              <div
                key={vault.address}
                className="animate-fade-up"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                <VaultInfo
                  vaultAddress={vault.address}
                  connectMode={!isConnected}
                  onDeposit={isConnected ? () => onOpenModal(vault.address) : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="bg-neutral-50 py-10 overflow-hidden">
        <div className="space-y-3">
          <div className="marquee-row">
            <Marquee duration="35s" gap="2rem">
              {marqueeRow1.map((q) => (
                <span key={q} className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm">
                  {q}
                </span>
              ))}
            </Marquee>
          </div>
          <div className="marquee-row">
            <Marquee duration="45s" gap="2rem" reverse>
              {marqueeRow2.map((q) => (
                <span key={q} className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm">
                  {q}
                </span>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-black text-neutral-900">How it works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { n: '1', title: 'Connect wallet', desc: 'Connect your Base wallet in one click. No sign-up required.', dir: 'scroll-fade-left' },
              { n: '2', title: 'Choose a vault', desc: 'Pick USDC, ETH, BTC, or EUR. See live APY and TVL.', dir: 'scroll-fade-up' },
              { n: '3', title: 'Start earning', desc: 'Deposit and earn yield automatically. Withdraw anytime.', dir: 'scroll-fade-right' },
            ].map((step) => (
              <div key={step.n} className={`${step.dir} rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm`}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-xl font-black text-teal-600">
                  {step.n}
                </div>
                <h3 className="mb-2 text-base font-bold text-neutral-900">{step.title}</h3>
                <p className="text-sm text-neutral-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-neutral-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-black text-neutral-900">Built for trust</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🔒', title: 'Non-custodial', desc: 'Your keys, your funds. Always.' },
              { icon: '🔍', title: 'Transparent', desc: 'All allocations visible on-chain.' },
              { icon: '✅', title: 'Audited', desc: 'Protocols audited by top firms.' },
              { icon: '⚡', title: 'Instant exit', desc: 'Withdraw anytime, no lock-up.' },
            ].map((card) => (
              <div key={card.title} className="trust-card rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="trust-icon mb-3 text-2xl text-neutral-400">{card.icon}</div>
                <h3 className="mb-1 text-sm font-bold text-neutral-900">{card.title}</h3>
                <p className="text-xs text-neutral-500">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-shimmer px-4 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to earn?</h2>
          <p className="mt-3 text-white/60">Join thousands earning real yield on Base. Start in 30 seconds.</p>
          <div className="mt-8 flex justify-center">
            {isConnected ? (
              <button
                type="button"
                onClick={() => onOpenModal(YO_VAULTS[0].address)}
                className="rounded-xl bg-teal-500 px-8 py-4 text-base font-bold text-white hover:bg-teal-400 transition-colors shadow-lg"
              >
                Start Earning Now
              </button>
            ) : (
              <ConnectButton label="Start Earning Now" />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0f1e] px-4 py-8 text-center text-xs text-white/30">
        <p>EarnButton · Powered by YO Protocol · Built on Base</p>
        <p className="mt-1">Not financial advice. DeFi involves risk. Always DYOR.</p>
      </footer>
    </main>
  )
}