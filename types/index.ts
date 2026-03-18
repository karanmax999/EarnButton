/**
 * Risk level for vaults and protocols
 * Used to indicate the risk profile of investment strategies
 */
export type RiskLevel = 'Low' | 'Medium' | 'High'

/**
 * Transaction types supported by the application
 */
export type TransactionType = 'approve' | 'deposit' | 'withdraw'

/**
 * Transaction status states during blockchain interaction
 */
export type TransactionStatusType = 'pending' | 'confirming' | 'success' | 'error'

/**
 * Vault metadata from YO Protocol
 * Contains all information about a vault including performance metrics and fees
 */
export interface VaultMetadata {
  /** Ethereum address of the vault contract */
  address: string
  
  /** Human-readable name of the vault */
  name: string
  
  /** Token symbol for the vault shares (ERC-20) */
  symbol: string
  
  /** Annual Percentage Yield - annualized rate of return */
  apy: number
  
  /** Risk level classification (Low, Medium, or High) */
  riskLevel: RiskLevel
  
  /** Total Value Locked - total assets deposited in the vault */
  tvl: bigint
  
  /** Description of the vault's investment strategy */
  strategy: string
  
  /** Address of the underlying asset (e.g., USDC) */
  underlyingAsset: string
  
  /** Minimum deposit amount required */
  minDeposit: bigint
  
  /** Maximum deposit amount allowed */
  maxDeposit: bigint
  
  /** Fee charged on deposits (percentage, 0-100) */
  depositFee: number
  
  /** Fee charged on withdrawals (percentage, 0-100) */
  withdrawalFee: number
  
  /** Fee charged on earned yield (percentage, 0-100) */
  performanceFee: number
}

/**
 * User position in a vault
 * Represents a user's investment in a specific YO Protocol vault
 */
export interface UserPosition {
  /** Ethereum address of the vault contract */
  vaultAddress: string
  
  /** Ethereum address of the user who owns this position */
  userAddress: string
  
  /** Number of vault shares (ERC-20 tokens) owned by the user */
  shares: bigint
  
  /** Original amount of USDC deposited by the user */
  depositedAmount: bigint
  
  /** Current value of the position in USDC */
  currentValue: bigint
  
  /** Total yield earned (currentValue - depositedAmount) */
  yieldEarned: bigint
  
  /** Unix timestamp when the deposit was made */
  depositedAt: number
  
  /** Unix timestamp of the last position update */
  lastUpdated: number
}

/**
 * Transaction status information
 * Tracks the state and details of blockchain transactions
 */
export interface TransactionStatus {
  /** Type of transaction being executed */
  type: TransactionType
  
  /** Current status of the transaction */
  status: TransactionStatusType
  
  /** Transaction hash (available after submission to blockchain) */
  txHash?: string
  
  /** Error message if transaction failed */
  error?: string
  
  /** Unix timestamp when the transaction was initiated */
  timestamp: number
}

/**
 * Protocol allocation within a vault
 * Describes how vault funds are deployed across different DeFi protocols
 */
export interface ProtocolAllocation {
  /** Name of the DeFi protocol (e.g., Aave, Compound) */
  protocol: string
  
  /** Description of the investment strategy used */
  strategy: string
  
  /** Amount of funds allocated to this protocol */
  allocation: bigint
  
  /** Percentage of total vault funds allocated (0-100) */
  percentage: number
  
  /** Annual Percentage Yield for this protocol allocation */
  apy: number
  
  /** Risk level of this protocol allocation */
  riskLevel: RiskLevel
  
  /** Unix timestamp of the last rebalance operation */
  lastRebalance: number
}

/**
 * Portfolio summary data
 * Aggregated view of all user positions across vaults
 */
export interface PortfolioData {
  /** Total amount deposited across all vaults */
  totalDeposited: bigint
  
  /** Current total value of all positions */
  currentValue: bigint
  
  /** Total yield earned across all positions */
  yieldEarned: bigint
  
  /** Weighted average APY across all positions */
  currentApy: number
  
  /** Array of individual vault positions */
  positions: VaultPosition[]
}

/**
 * Individual vault position for portfolio display
 * Simplified view of a user's position for dashboard rendering
 */
export interface VaultPosition {
  /** Ethereum address of the vault contract */
  vaultAddress: string
  
  /** Human-readable name of the vault */
  vaultName: string
  
  /** Original amount deposited in this vault */
  depositedAmount: bigint
  
  /** Current value of this position */
  currentValue: bigint
  
  /** Number of vault shares owned */
  shares: bigint
  
  /** Current APY for this vault */
  apy: number
  
  /** Unix timestamp when the deposit was made */
  depositedAt: number
}

/**
 * Fund deployment details
 * Detailed breakdown of how funds are deployed in a specific protocol
 */
export interface FundDeployment {
  /** Name of the DeFi protocol */
  protocol: string
  
  /** Description of the investment strategy */
  strategy: string
  
  /** Amount of funds allocated to this protocol */
  allocation: bigint
  
  /** Percentage of total funds (0-100) */
  percentage: number
  
  /** Annual Percentage Yield for this deployment */
  apy: number
  
  /** Risk level of this deployment */
  riskLevel: RiskLevel
}
