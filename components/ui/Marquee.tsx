'use client'

import React from 'react'
import clsx from 'clsx'
const cn = clsx

interface MarqueeProps {
  className?: string
  reverse?: boolean
  duration?: string
  gap?: string
  children: React.ReactNode
  repeat?: number
}

export function Marquee({
  className,
  reverse = false,
  duration = '40s',
  gap = '1rem',
  children,
  repeat = 4,
}: MarqueeProps) {
  return (
    <div
      className={cn('flex overflow-hidden', className)}
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={reverse ? 'animate-marquee-reverse' : 'animate-marquee'}
          style={{ '--duration': duration, '--gap': gap } as React.CSSProperties}
          aria-hidden={i > 0}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
