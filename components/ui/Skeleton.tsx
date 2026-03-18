import React from 'react'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

/**
 * Shimmer skeleton placeholder for loading states.
 * Uses CSS animation — works in light and dark contexts.
 */
export function Skeleton({ width, height, borderRadius = '0.5rem', className = '' }: SkeletonProps) {
  return (
    <span
      className={`skeleton-shimmer inline-block ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        borderRadius,
        display: 'inline-block',
      }}
      aria-hidden="true"
    />
  )
}
