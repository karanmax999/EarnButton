// Agent dashboard components
// This directory contains all agent dashboard UI components

export { default as AgentIdentity } from './AgentIdentity'
export type { AgentIdentityProps } from './AgentIdentity'

export { default as ReputationScore } from './ReputationScore'
export type { ReputationScoreProps } from './ReputationScore'

export { default as RiskRouter } from './RiskRouter'
export type { RiskRouterProps } from './RiskRouter'

export { default as CapitalSandbox } from './CapitalSandbox'
export type { CapitalSandboxProps } from './CapitalSandbox'

export { default as TradeIntent } from './TradeIntent'
export type { TradeIntentProps } from './TradeIntent'

export { default as ValidationArtifact } from './ValidationArtifact'
export type { ValidationArtifactProps } from './ValidationArtifact'

export { default as AgentActivity } from './AgentActivity'
export type { AgentActivityProps } from './AgentActivity'

export { default as AgentDashboard } from './AgentDashboard'
export type { AgentDashboardProps } from './AgentDashboard'

// Skeleton loaders
export {
  AgentIdentitySkeleton,
  ReputationScoreSkeleton,
  RiskRouterSkeleton,
  CapitalSandboxSkeleton,
  TradeIntentSkeleton,
  ValidationArtifactSkeleton,
  AgentActivitySkeleton,
} from './AgentSkeleton'
