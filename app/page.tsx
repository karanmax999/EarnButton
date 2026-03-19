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
import CTASection from '@/components/CTASection'
import FeatureCarousel from '@/components/ui/feature-carousel'
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

              {/* Desktop nav links */}
              {isConnected && (
                <nav className="hidden sm:flex items-center gap-6">
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

            {/* APY Ticker — centered, desktop only */}
            <div className="hidden lg:flex flex-1 justify-center px-4">
              <APYTicker />
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
        className="relative overflow-hidden bg-[#0a0f1e] min-h-screen flex items-center"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px', paddingTop: '64px' }}
      >
        {/* Background glow — left side */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb-1 absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-3xl" />
          <div className="hero-orb-2 absolute bottom-1/4 -left-16 h-64 w-64 rounded-full bg-teal-400/8 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          {/* Split layout */}
          <div className="flex flex-col-reverse md:flex-row md:items-center md:gap-12">

            {/* LEFT — text */}
            <div className="flex-[55] mt-10 md:mt-0">
              {/* Eyebrow */}
              <div className="animate-fade-up mb-5 flex items-center gap-2" style={{ animationDelay: '0ms' }}>
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="font-mono text-xs tracking-[0.2em] text-teal-400 uppercase">
                  Powered by YO Protocol · Live on Base
                </span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-up text-4xl sm:text-5xl font-black text-white leading-tight" style={{ animationDelay: '80ms' }}>
                The smartest savings<br />
                account{' '}
                <span className="text-teal-400">in DeFi.</span>
              </h1>

              {/* Subheadline */}
              <p className="animate-fade-up mt-5 text-base text-gray-300 max-w-md" style={{ animationDelay: '180ms' }}>
                Earn 5–9% APY on USDC, ETH, BTC, and EUR. One tap. No complexity. Powered by YO Protocol on Base.
              </p>

              {/* Stats 2×2 */}
              <div className="animate-fade-up mt-8 grid grid-cols-2 gap-4 max-w-sm" style={{ animationDelay: '280ms' }}>
                {[
                  { value: '$44M+', label: 'Total TVL' },
                  { value: '5.29%', label: 'Top APY' },
                  { value: '4', label: 'Vaults' },
                  { value: '0%', label: 'Lock-up' },
                ].map((s) => (
                  <div key={s.label} className="border-l-2 border-teal-500 pl-3">
                    <p className="text-lg font-bold text-white leading-none">{s.value}</p>
                    <p className="mt-0.5 text-xs text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="animate-fade-up mt-8 flex flex-col sm:flex-row gap-3" style={{ animationDelay: '380ms' }}>
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => onOpenModal(YO_VAULTS[0].address)}
                    className="btn-earn w-full sm:w-auto rounded-xl bg-teal-500 px-8 py-4 text-base font-semibold text-white hover:bg-teal-400 transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    Earn with YO <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <ConnectButton label="Earn with YO →" />
                )}
                <a
                  href="#vaults"
                  className="btn-vaults w-full sm:w-auto rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white/80 hover:border-white/60 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  View Vaults
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* RIGHT — image */}
            <div className="flex-[45] flex justify-center md:justify-end">
              <div className="relative w-full max-w-[480px] md:max-w-none">
                <div className="relative rounded-2xl overflow-hidden max-h-64 md:max-h-none">
                  <Image
                    src="/One_Tap_to_Higher_Yields_version1.png"
                    alt="EarnButton — DeFi yield made simple"
                    width={600}
                    height={500}
                    priority
                    className="w-full h-auto object-cover rounded-2xl"
                  />
                  {/* Left-edge fade blending into dark bg */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-[120px]"
                    style={{ background: 'linear-gradient(to right, #0a0f1e, transparent)' }}
                  />
                </div>
              </div>
            </div>

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
      <section className="px-4 py-16 sm:py-20" style={{ background: '#080d14' }}>
        <div className="mx-auto max-w-lg">
          <YieldCalculator apyMap={apyMap} />
        </div>
      </section>

      {/* Vaults */}
      <section id="vaults" className="px-4 py-16 sm:py-20" style={{ background: '#0d1421' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-white">Choose your vault</h2>
            <p className="mt-2 text-gray-400">Four assets. Real yield. All on Base.</p>
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
      <section className="py-10 overflow-hidden" style={{ background: '#080d14' }}>
        <div className="space-y-3">
          <div className="marquee-row">
            <Marquee duration="35s" gap="2rem">
              {marqueeRow1.map((q) => (
                <span key={q} className="shrink-0 rounded-full px-4 py-2 text-sm text-gray-400 transition-colors hover:text-teal-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {q}
                </span>
              ))}
            </Marquee>
          </div>
          <div className="marquee-row">
            <Marquee duration="45s" gap="2rem" reverse>
              {marqueeRow2.map((q) => (
                <span key={q} className="shrink-0 rounded-full px-4 py-2 text-sm text-gray-400 transition-colors hover:text-teal-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {q}
                </span>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* Feature Carousel — replaces How It Works + Built for Trust */}
      <section className="py-16" style={{ background: '#080d14' }}>
        <div className="mx-auto max-w-6xl">
          <FeatureCarousel />
        </div>
      </section>

      <CTASection
          isConnected={isConnected}
          onOpenModal={() => onOpenModal(YO_VAULTS[0].address)}
        />
    </main>
  )
}