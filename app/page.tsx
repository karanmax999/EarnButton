'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import Image from 'next/image'
import VaultInfo from '@/components/VaultInfo'
import Dashboard from '@/components/Dashboard'
import EarnModal from '@/components/EarnModal'
import NetworkGuard from '@/components/NetworkGuard'
import APYTicker from '@/components/APYTicker'
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

// ─── Hamburger menu ───────────────────────────────────────────────────────────

function MobileMenu({
  isConnected,
  currentView,
  setCurrentView,
  onClose,
}: {
  isConnected: boolean
  currentView: CurrentView
  setCurrentView: (v: CurrentView) => void
  onClose: () => void
}) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-[#0a0f1e] border-b border-white/10 shadow-lg sm:hidden">
      <nav className="flex flex-col px-4 py-3 gap-1">
        {isConnected && (
          <>
            <button
              type="button"
              onClick={() => { setCurrentView('home'); onClose() }}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'home' ? 'bg-teal-500/10 text-teal-400' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => { setCurrentView('dashboard'); onClose() }}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-teal-500/10 text-teal-400' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
            >
              Dashboard
            </button>
          </>
        )}
        <Link
          href="/demo"
          onClick={onClose}
          className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-teal-400 hover:bg-white/5 transition-colors"
        >
          For Developers →
        </Link>
      </nav>
    </div>
  )
}

export default function Home() {
  const { isConnected, address } = useAccount()
  const [currentView, setCurrentView] = useState<CurrentView>('home')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVault, setSelectedVault] = useState(YO_VAULTS[0].address)
  const [refetchDashboard, setRefetchDashboard] = useState<(() => void) | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { vaults } = useYOVaults()

  const apyMap: Record<string, number> = {}
  vaults.forEach((v) => { apyMap[v.address.toLowerCase()] = v.apy })

  useEffect(() => {
    if (isConnected) setCurrentView('dashboard')
    else setCurrentView('home')
  }, [isConnected])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMobileMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
    <NetworkGuard>
      <div className="min-h-screen bg-white">
        <header className="navbar-glass sticky top-0 z-40">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 relative">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="flex items-center hover:opacity-80 transition-opacity"
                aria-label="EarnButton home"
              >
                <Image src="/logo.svg" alt="EarnButton" width={140} height={32} priority />
              </button>

              <APYTicker />

            {/* Desktop nav links */}
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

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Link
                href="/demo"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-white/60 hover:text-teal-400 transition-colors"
              >
                For Developers →
              </Link>
              <ConnectButton />
              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="sm:hidden flex items-center justify-center h-9 w-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile dropdown */}
            {mobileMenuOpen && (
              <MobileMenu
                isConnected={isConnected}
                currentView={currentView}
                setCurrentView={setCurrentView}
                onClose={() => setMobileMenuOpen(false)}
              />
            )}
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
    </NetworkGuard>
  )
}

// ─── VaultCardWrapper — scroll-triggered entrance ────────────────────────────

function VaultCardWrapper({ children, dir }: { children: React.ReactNode; dir: 'from-left' | 'from-bottom' | 'from-right' }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          obs.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={`vault-card-enter ${dir} h-full`}>
      {children}
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
        {/* Floating orbs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb-1 absolute -top-16 -left-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="hero-orb-2 absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-teal-400/8 blur-3xl" />
          <div className="hero-orb-3 absolute -bottom-10 left-1/3 h-56 w-56 rounded-full bg-teal-600/10 blur-3xl" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight">
            {['The', 'smartest', 'savings', 'account', 'in', 'DeFi.'].map((word, i) => (
              <span
                key={word + i}
                className={`word-animate${i >= 4 ? ' text-teal-400' : ''}`}
                style={{ animationDelay: `${i * 80}ms`, marginRight: i === 2 ? '0' : '0.25em' }}
              >
                {word}{i === 2 ? <br /> : null}
              </span>
            ))}
          </h1>
          <p className="animate-fade-up mt-5 text-lg text-white/60 max-w-xl mx-auto" style={{ animationDelay: '150ms' }}>
            Earn 5-9% APY on USDC, ETH, BTC, and EUR. One tap. No complexity. Powered by YO Protocol on Base.
          </p>
          <div className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/50" style={{ animationDelay: '300ms' }}>
            <span className="stat-item flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live on Base Mainnet
            </span>
            <span>|</span>
            <span className="stat-item">$<span ref={tvlRef}>{tvlValue}</span>M+ TVL</span>
            <span>|</span>
            <span className="stat-item">Non-custodial</span>
            <span>|</span>
            <span className="stat-item">Audited</span>
          </div>
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '450ms' }}>
            {isConnected ? (
              <button
                type="button"
                onClick={() => onOpenModal(YO_VAULTS[0].address)}
                className="btn-earn rounded-xl bg-teal-500 px-7 py-3.5 text-sm font-bold text-white hover:bg-teal-400 transition-colors shadow-lg"
              >
                Earn with YO
              </button>
            ) : (
              <ConnectButton label="Earn with YO" />
            )}
            <a href="#vaults" className="btn-vaults rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/80">
              View Vaults
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          className={`scroll-indicator${scrolled ? ' hidden-indicator' : ''} absolute bottom-6 left-1/2 -translate-x-1/2`}
        >
          <svg className="h-6 w-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {YO_VAULTS.map((vault, i) => {
              const dirs = ['from-left', 'from-bottom', 'from-bottom', 'from-right'] as const
              return (
                <VaultCardWrapper key={vault.address} dir={dirs[i] ?? 'from-bottom'}>
                  <VaultInfo
                    vaultAddress={vault.address}
                    connectMode={!isConnected}
                    onDeposit={isConnected ? () => onOpenModal(vault.address) : undefined}
                  />
                </VaultCardWrapper>
              )
            })}
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
      <footer className="bg-[#0a0f1e] px-4 py-10 text-center text-xs text-white/30">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-white/50">
            <a href="https://yo.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              yo.xyz
            </a>
            <span>·</span>
            <a href="https://docs.yo.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Docs
            </a>
            <span>·</span>
            <a
              href="https://basescan.org/address/0x0000000f2eb9f69274678c76222b35eec7588a65"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              yoUSD on Basescan ↗
            </a>
            <span>·</span>
            <Link href="/demo" className="hover:text-white transition-colors">
              For Developers
            </Link>
          </div>
          <p>EarnButton · Powered by YO Protocol · Built on Base</p>
          <p>Not financial advice. DeFi involves risk. Always DYOR.</p>
        </div>
      </footer>
    </main>
  )
}