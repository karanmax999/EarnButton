'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

const cardBase: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 20,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 220,
}

/**
 * AgentIdentitySkeleton
 *
 * Loading skeleton for the AgentIdentity card.
 * Renders placeholder shapes matching the AgentIdentity layout.
 *
 * @returns Skeleton card for AgentIdentity
 */
export function AgentIdentitySkeleton() {
  return (
    <div style={cardBase}>
      <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.3)' }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="80%" />
        </div>
        <div className="space-y-2">
          <Skeleton height={16} width="40%" />
          <Skeleton height={20} width="100%" />
        </div>
        <div className="mt-auto">
          <Skeleton height={44} />
        </div>
      </div>
    </div>
  )
}

/**
 * ReputationScoreSkeleton
 *
 * Loading skeleton for the ReputationScore card.
 * Renders placeholder shapes matching the three-metric layout.
 *
 * @returns Skeleton card for ReputationScore
 */
export function ReputationScoreSkeleton() {
  return (
    <div style={cardBase}>
      <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.3)' }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div>
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="80%" className="mt-2" />
        </div>
        <div className="space-y-3">
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </div>
      </div>
    </div>
  )
}

/**
 * RiskRouterSkeleton
 *
 * Loading skeleton for the RiskRouter card.
 * Renders placeholder shapes matching the risk ratings table layout.
 *
 * @returns Skeleton card for RiskRouter
 */
export function RiskRouterSkeleton() {
  return (
    <div style={{ ...cardBase, minHeight: 300 }}>
      <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.3)' }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div>
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="80%" className="mt-2" />
        </div>
        <div className="space-y-3">
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
        </div>
      </div>
    </div>
  )
}

/**
 * CapitalSandboxSkeleton
 *
 * Loading skeleton for the CapitalSandbox card.
 * Renders placeholder shapes matching the balance and claim button layout.
 *
 * @returns Skeleton card for CapitalSandbox
 */
export function CapitalSandboxSkeleton() {
  return (
    <div style={cardBase}>
      <div className="h-[3px] w-full" style={{ background: 'rgba(34, 197, 94, 0.3)' }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="80%" />
        </div>
        <div className="space-y-3">
          <div>
            <Skeleton height={14} width="40%" />
            <Skeleton height={20} width="100%" className="mt-2" />
          </div>
          <div>
            <Skeleton height={14} width="40%" />
            <Skeleton height={20} width="100%" className="mt-2" />
          </div>
        </div>
        <div className="mt-auto">
          <Skeleton height={44} />
        </div>
      </div>
    </div>
  )
}

/**
 * TradeIntentSkeleton
 *
 * Loading skeleton for the TradeIntent card.
 * Renders placeholder shapes matching the trade form layout.
 *
 * @returns Skeleton card for TradeIntent
 */
export function TradeIntentSkeleton() {
  return (
    <div style={cardBase}>
      <div className="h-[3px] w-full" style={{ background: 'rgba(168, 85, 247, 0.3)' }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="80%" />
        </div>
        <div className="space-y-3">
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
        <div className="mt-auto">
          <Skeleton height={44} />
        </div>
      </div>
    </div>
  )
}

/**
 * ValidationArtifactSkeleton
 *
 * Loading skeleton for the ValidationArtifact card.
 * Renders placeholder shapes matching the three-artifact section layout.
 *
 * @returns Skeleton card for ValidationArtifact
 */
export function ValidationArtifactSkeleton() {
  return (
    <div style={cardBase}>
      <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.3)' }} />
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div>
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="80%" className="mt-2" />
        </div>
        <div className="space-y-3">
          <Skeleton height={80} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </div>
      </div>
    </div>
  )
}

/**
 * AgentActivitySkeleton
 *
 * Loading skeleton for the AgentActivity card.
 * Renders placeholder shapes matching the trade history table layout.
 *
 * @returns Skeleton card for AgentActivity
 */
export function AgentActivitySkeleton() {
  return (
    <div style={{ ...cardBase, minHeight: 'auto' }}>
      <div className="h-[3px] w-full" style={{ background: 'rgba(99, 102, 241, 0.3)' }} />
      <div className="p-6 space-y-4">
        <Skeleton height={24} width="40%" />
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} height={48} borderRadius="0.5rem" />
          ))}
        </div>
      </div>
    </div>
  )
}
