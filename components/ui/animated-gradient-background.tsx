'use client'

import { useEffect, useRef } from 'react'

interface AnimatedGradientBackgroundProps {
  gradientColors?: string[]
  gradientStops?: number[]
  animationSpeed?: number
  breathingRange?: number
  Breathing?: boolean
  topOffset?: number
  containerClassName?: string
}

export function AnimatedGradientBackground({
  gradientColors = ['#050d1a', '#003d2e', '#005a42', '#007a58', '#00c896', '#0a0f1e', '#050d1a'],
  gradientStops = [30, 45, 58, 68, 78, 90, 100],
  animationSpeed = 0.015,
  breathingRange = 8,
  Breathing = true,
  topOffset = 10,
  containerClassName = '',
}: AnimatedGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = () => {
      timeRef.current += animationSpeed
      const w = canvas.width
      const h = canvas.height

      // breathing offset
      const breathOffset = Breathing
        ? Math.sin(timeRef.current) * breathingRange
        : 0

      const gradient = ctx.createLinearGradient(0, (topOffset + breathOffset) / 100 * h, 0, h)
      gradientColors.forEach((color, i) => {
        gradient.addColorStop(Math.min((gradientStops[i] ?? 100) / 100, 1), color)
      })

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
    }
  }, [gradientColors, gradientStops, animationSpeed, breathingRange, Breathing, topOffset])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${containerClassName}`}
      aria-hidden="true"
    />
  )
}
