'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckmarkCircle01Icon,
  MagicWandIcon,
  GlobalSearchIcon,
  DashboardSquare01Icon,
  SmartPhone01Icon,
  AiCloudIcon,
  LockIcon,
  FlashIcon,
  WalletIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const BRAND = '#0a1628'

const FEATURES = [
  {
    id: 'deposit',
    label: 'One-tap deposit',
    icon: CheckmarkCircle01Icon,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200',
    description:
      'Connect wallet, choose a vault, deposit in seconds. No complexity. No learning curve.',
  },
  {
    id: 'yield',
    label: 'Automatic yield',
    icon: MagicWandIcon,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200',
    description:
      'YO Protocol automatically deploys your funds across Aave, Morpho and Compound for maximum yield.',
  },
  {
    id: 'noncustodial',
    label: 'Non-custodial',
    icon: LockIcon,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200',
    description:
      'Your keys, your funds. EarnButton never holds your assets. All transactions on Base mainnet.',
  },
  {
    id: 'transparent',
    label: 'Full transparency',
    icon: GlobalSearchIcon,
    image: 'https://images.unsplash.com/photo-1551288049-bbda38a10ad5?q=80&w=1200',
    description:
      'Every allocation is visible on-chain. See exactly where your funds are deployed, always.',
  },
  {
    id: 'multiasset',
    label: '4 assets',
    icon: DashboardSquare01Icon,
    image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200',
    description:
      'Earn yield on USDC, ETH, Bitcoin and Euro. Four vaults. One interface. All on Base.',
  },
  {
    id: 'instant',
    label: 'Instant exit',
    icon: FlashIcon,
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200',
    description:
      'No lock-up periods. No waiting. Redeem your vault shares for the underlying asset any time.',
  },
  {
    id: 'ai',
    label: 'AI advisor',
    icon: AiCloudIcon,
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=1200',
    description:
      'Ask our AI advisor which vault fits your risk profile. Powered by Claude. Always honest.',
  },
  {
    id: 'audited',
    label: 'Audited protocols',
    icon: WalletIcon,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200',
    description:
      'Funds deploy only to battle-tested protocols with billions in TVL and independent audits.',
  },
  {
    id: 'base',
    label: 'Built on Base',
    icon: SmartPhone01Icon,
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200',
    description:
      'Base gives sub-cent gas fees enabling micro-deposits and instant rebalancing at any size.',
  },
]

export default function FeatureCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused) return
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % FEATURES.length)
    }, 3500)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused])

  const feature = FEATURES[active]

  return (
    <div className="w-full">
      {/* Section heading */}
      <div className="text-center mb-10 px-4">
        <p className="text-teal-500 text-xs font-mono tracking-widest mb-2 uppercase">
          Why EarnButton
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Everything you need to earn yield
        </h2>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
          Nine reasons thousands choose EarnButton over building their own DeFi strategy.
        </p>
      </div>

      {/* Carousel */}
      <div
        className="flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl mx-4 lg:mx-0"
        style={{ minHeight: 480 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Left panel — feature list */}
        <div
          className="lg:w-[340px] shrink-0 flex flex-col gap-1 p-4 overflow-y-auto"
          style={{ background: BRAND }}
        >
          {FEATURES.map((f, i) => {
            const isActive = i === active
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActive(i)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 border"
                style={{
                  background: isActive ? '#00c896' : 'transparent',
                  borderColor: isActive ? '#00c896' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
              >
                <HugeiconsIcon
                  icon={f.icon}
                  size={18}
                  color={isActive ? '#fff' : 'rgba(255,255,255,0.35)'}
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium">{f.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right panel — image + description */}
        <div className="relative flex-1 overflow-hidden" style={{ minHeight: 320 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              {/* Background image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feature.image}
                alt={feature.label}
                className="w-full h-full object-cover"
              />

              {/* Left gradient fade */}
              <div
                className="absolute inset-y-0 left-0 w-32 pointer-events-none"
                style={{ background: `linear-gradient(to right, ${BRAND}, transparent)` }}
              />

              {/* Bottom gradient + text */}
              <div
                className="absolute inset-x-0 bottom-0 p-8"
                style={{
                  background: 'linear-gradient(to top, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.6) 60%, transparent 100%)',
                }}
              >
                <p className="text-teal-400 text-xs font-mono tracking-widest uppercase mb-2">
                  {feature.label}
                </p>
                <p className="text-white text-lg font-semibold max-w-lg leading-snug">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="absolute top-4 right-4 flex gap-1.5 z-10">
            {FEATURES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 20 : 6,
                  height: 6,
                  background: i === active ? '#00c896' : 'rgba(255,255,255,0.3)',
                }}
                aria-label={`Go to feature ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
