/**
 * Agent Dashboard Type Definitions
 * 
 * This module contains all TypeScript interfaces and types for the Agent Dashboard feature.
 * It includes types for agent identity, trade intents, risk ratings, validation artifacts,
 * reputation metrics, capital sandbox, trades, and API responses.
 */

/**
 * Agent Identity - Represents an autonomous trading agent registered on-chain
 * 
 * @interface AgentIdentity
 * @property {string} id - Unique identifier for the agent
 * @property {string} name - Human-readable name of the agent
 * @property {string} walletAddress - Ethereum address of the agent's wallet
 * @property {bigint} tokenId - ERC-721 token ID representing the agent's on-chain identity
 * @property {string[]} capabilities - List of trading capabilities enabled for this agent
 * @property {number} registeredAt - Unix timestamp when the agent was registered
 * @property {'pending' | 'live'} status - Current registration status (pending confirmation or live)
 */
export interface AgentIdentity {
  id: string
  name: string
  walletAddress: string
  tokenId: bigint
  capabilities: string[]
  registeredAt: number
  status: 'pending' | 'live'
}

/**
 * Trade Intent - Structured data object specifying a proposed trade
 * 
 * Represents a trade order with asset, amount, and direction. Can be signed with EIP-712
 * for authenticated submission to the trading system.
 * 
 * @interface TradeIntent
 * @property {string} asset - Trading pair identifier (e.g., "ETH/USDC")
 * @property {bigint} amount - Amount to trade in base units (wei for ETH, etc.)
 * @property {'buy' | 'sell'} direction - Trade direction (buy or sell)
 * @property {number} timestamp - Unix timestamp when the intent was created
 * @property {string} [signature] - Optional EIP-712 signature of the trade intent
 * @property {string} [priceProof] - Optional RedStone price proof attached to the trade
 */
export interface TradeIntent {
  asset: string
  amount: bigint
  direction: 'buy' | 'sell'
  timestamp: number
  signature?: string
  priceProof?: string
}

/**
 * Risk Rating - Credora-provided risk assessment for vault positions
 * 
 * Contains position limits, leverage constraints, and loss thresholds for risk management.
 * 
 * @interface RiskRating
 * @property {string} vaultAddress - Ethereum address of the vault
 * @property {string} vaultName - Human-readable name of the vault
 * @property {bigint} positionLimit - Maximum position size allowed in this vault
 * @property {number} maxLeverage - Maximum leverage ratio allowed
 * @property {bigint} dailyLossLimit - Maximum daily loss threshold
 * @property {'low' | 'medium' | 'high'} riskLevel - Risk classification level
 * @property {number} updatedAt - Unix timestamp of the last risk rating update
 */
export interface RiskRating {
  vaultAddress: string
  vaultName: string
  positionLimit: bigint
  maxLeverage: number
  dailyLossLimit: bigint
  riskLevel: 'low' | 'medium' | 'high'
  updatedAt: number
}

/**
 * Validation Artifact - Cryptographic proof bundle for trade validation
 * 
 * Contains TEE attestation, EigenAI inference signature, and RedStone price proof
 * to verify the integrity of trades.
 * 
 * @interface ValidationArtifact
 * @property {string} teeHash - Hash of the Trusted Execution Environment attestation
 * @property {boolean} teeVerified - Whether the TEE attestation has been verified
 * @property {string} eigenaiSignature - EigenCloud EigenAI inference signature
 * @property {string} eigenaiModel - Version identifier of the EigenAI model used
 * @property {string} redstoneProof - RedStone oracle price proof
 * @property {number} redstoneTimestamp - Unix timestamp of the RedStone price proof
 */
export interface ValidationArtifact {
  teeHash: string
  teeVerified: boolean
  eigenaiSignature: string
  eigenaiModel: string
  redstoneProof: string
  redstoneTimestamp: number
}

/**
 * Reputation Metrics - On-chain reputation score from ERC-8004 Reputation Registry
 * 
 * Measures agent performance through risk-adjusted returns and validation accuracy.
 * 
 * @interface ReputationMetrics
 * @property {number} sharpeRatio - Risk-adjusted return metric (yield / volatility)
 * @property {number} drawdownPercentage - Maximum peak-to-trough decline percentage
 * @property {number} validationScore - Percentage of successful validations (0-100)
 * @property {number} updatedAt - Unix timestamp of the last reputation update
 */
export interface ReputationMetrics {
  sharpeRatio: number
  drawdownPercentage: number
  validationScore: number
  updatedAt: number
}

/**
 * Capital Sandbox - Test environment vault for agents to trade with allocated capital
 * 
 * Allows agents to practice trading before live trading with real capital.
 * 
 * @interface CapitalSandbox
 * @property {string} vaultAddress - Ethereum address of the sandbox vault contract
 * @property {bigint} balance - Current balance in the sandbox vault (in USDC)
 * @property {boolean} claimed - Whether the capital has been claimed by the agent
 * @property {bigint} ethAllocation - Allocated ETH amount for gas fees
 */
export interface CapitalSandbox {
  vaultAddress: string
  balance: bigint
  claimed: boolean
  ethAllocation: bigint
}

/**
 * Trade - Executed trade record with status and details
 * 
 * Represents a completed or pending trade with all relevant metadata.
 * 
 * @interface Trade
 * @property {string} id - Unique identifier for the trade
 * @property {number} timestamp - Unix timestamp when the trade was executed
 * @property {string} assetPair - Trading pair (e.g., "ETH/USDC")
 * @property {bigint} amount - Amount traded in base units
 * @property {'buy' | 'sell'} direction - Trade direction
 * @property {number} executionPrice - Price at which the trade was executed
 * @property {'pending' | 'confirmed' | 'failed'} status - Current trade status
 * @property {string} [txHash] - Optional transaction hash on the blockchain
 * @property {bigint} [gasUsed] - Optional gas used for the transaction
 * @property {number} [slippage] - Optional slippage percentage
 * @property {ValidationArtifact} [validationArtifacts] - Optional validation artifacts for the trade
 */
export interface Trade {
  id: string
  timestamp: number
  assetPair: string
  amount: bigint
  direction: 'buy' | 'sell'
  executionPrice: number
  status: 'pending' | 'confirmed' | 'failed'
  txHash?: string
  gasUsed?: bigint
  slippage?: number
  validationArtifacts?: ValidationArtifact
}

/**
 * Agent Register Response - API response from agent registration endpoint
 * 
 * Returned by POST /api/agent/register after successful agent registration.
 * 
 * @interface AgentRegisterResponse
 * @property {boolean} success - Whether the registration was successful
 * @property {string} agentId - Unique identifier assigned to the registered agent
 * @property {string} txHash - Transaction hash of the registration on-chain
 * @property {string} [message] - Optional message with additional details
 */
export interface AgentRegisterResponse {
  success: boolean
  agentId: string
  txHash: string
  message?: string
}

/**
 * Trade Submit Response - API response from trade submission endpoint
 * 
 * Returned by POST /api/agent/trade after successful trade submission.
 * 
 * @interface TradeSubmitResponse
 * @property {boolean} success - Whether the trade submission was successful
 * @property {string} txHash - Transaction hash of the trade on-chain
 * @property {string} tradeId - Unique identifier assigned to the trade
 * @property {string} [message] - Optional message with additional details
 */
export interface TradeSubmitResponse {
  success: boolean
  txHash: string
  tradeId: string
  message?: string
}

/**
 * Validation Record Response - API response from validation recording endpoint
 * 
 * Returned by POST /api/agent/validate after successfully recording validation artifacts.
 * 
 * @interface ValidationRecordResponse
 * @property {boolean} success - Whether the validation recording was successful
 * @property {string} txHash - Transaction hash of the validation recording on-chain
 * @property {string} [message] - Optional message with additional details
 */
export interface ValidationRecordResponse {
  success: boolean
  txHash: string
  message?: string
}

/**
 * Reputation Response - API response from reputation data endpoint
 * 
 * Returned by GET /api/agent/reputation with current reputation metrics.
 * 
 * @interface ReputationResponse
 * @property {number} sharpeRatio - Risk-adjusted return metric
 * @property {number} drawdownPercentage - Maximum drawdown percentage
 * @property {number} validationScore - Validation success percentage
 * @property {number} updatedAt - Unix timestamp of the last update
 */
export interface ReputationResponse {
  sharpeRatio: number
  drawdownPercentage: number
  validationScore: number
  updatedAt: number
}
