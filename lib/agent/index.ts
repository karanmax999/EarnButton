// Agent library services
// This directory contains all agent-related service implementations

export {
  createTradeIntent,
  serializeTradeIntent,
  parseTradeIntent,
  prettyPrintTradeIntent,
} from './tradeIntent'

export {
  serializeValidationArtifact,
  parseValidationArtifact,
  prettyPrintValidationArtifact,
  validateArtifactCompleteness,
} from './validationArtifact'

export {
  fetchReputationMetrics,
  subscribeToReputationUpdates,
} from './erc8004'

export {
  fetchRiskRatings,
  subscribeToRiskUpdates,
  mapRiskLevelToColor,
} from './credora'

export {
  fetchPriceProof,
  verifyPriceProof,
} from './redstone'

export {
  fetchValidationArtifacts,
  recordValidationArtifacts,
} from './eigencloud'
export {
  registerAgent,
  fetchAgentIdentity,
  pollAgentRegistration,
} from './agentService'

export {
  submitTrade,
  fetchTradeHistory,
  pollTradeStatus,
} from './tradeService'

export {
  fetchSandboxBalance,
  claimCapital,
  pollClaimStatus,
} from './sandboxService'

export {
  useAgentWallet,
  useAgentData,
  useWalletGuard,
  useAgentDataCache,
} from './walletHooks'

export {
  apiClient,
  apiPost,
  apiGet,
  apiPut,
  apiDelete,
} from './apiClient'

export {
  validateEthereumAddress,
  validatePositiveNumber,
  validateAssetSupported,
  validateTradeIntentComplete,
  validateAmountWithinLimits,
  validateApiResponseStructure,
  sanitizeUserInput,
  validateTransactionHash,
  validatePercentage,
  validateSharpeRatio,
  validateDrawdownPercentage,
} from './validation'
