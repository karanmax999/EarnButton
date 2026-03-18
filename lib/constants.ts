import { base, baseSepolia } from 'wagmi/chains'

const useTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true'

/**
 * Network configuration — switches between Base mainnet and Base Sepolia testnet
 */
export const SUPPORTED_CHAIN = useTestnet ? baseSepolia : base

/**
 * Contract addresses
 */
export const CONTRACTS = {
  // USDC on Base mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  // USDC on Base Sepolia:  0x036CbD53842c5426634e7929541eC2318f3dCF7e
  USDC: (useTestnet
    ? '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`,

  // WETH on Base mainnet (canonical)
  WETH: '0x4200000000000000000000000000000000000006' as `0x${string}`,

  // cbBTC on Base mainnet
  CBBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as `0x${string}`,

  // EURC on Base mainnet
  EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42' as `0x${string}`,

  // yoGateway — single entry point for all deposits and redeems
  YO_GATEWAY: (process.env.NEXT_PUBLIC_YO_GATEWAY_ADDRESS ||
    '0xF1EeE0957267b1A474323Ff9CfF7719E964969FA') as `0x${string}`,

  // Primary vault (kept for backward compat)
  YO_VAULT: (process.env.NEXT_PUBLIC_YO_VAULT_ADDRESS || '') as `0x${string}`,
} as const

/**
 * All supported YO Protocol vaults on Base mainnet
 */
export const YO_VAULTS = [
  {
    address: (process.env.NEXT_PUBLIC_YO_VAULT_YOUSD ||
      '0x0000000f2eb9f69274678c76222b35eec7588a65') as `0x${string}`,
    name: 'yoUSD',
    asset: 'USDC',
    assetAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    decimals: 6,
    description: 'Earn yield on USDC',
  },
  {
    address: (process.env.NEXT_PUBLIC_YO_VAULT_YOETH ||
      '0x3a43aec53490cb9fa922847385d82fe25d0e9de7') as `0x${string}`,
    name: 'yoETH',
    asset: 'WETH',
    assetAddress: '0x4200000000000000000000000000000000000006' as `0x${string}`,
    decimals: 18,
    description: 'Earn yield on ETH',
  },
  {
    address: (process.env.NEXT_PUBLIC_YO_VAULT_YOBTC ||
      '0xbcbc8cb4d1e8ed048a6276a5e94a3e952660bcbc') as `0x${string}`,
    name: 'yoBTC',
    asset: 'cbBTC',
    assetAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as `0x${string}`,
    decimals: 8,
    description: 'Earn yield on Bitcoin',
  },
  {
    address: (process.env.NEXT_PUBLIC_YO_VAULT_YOEUR ||
      '0x50c749ae210d3977adc824ae11f3c7fd10c871e9') as `0x${string}`,
    name: 'yoEUR',
    asset: 'EURC',
    assetAddress: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42' as `0x${string}`,
    decimals: 6,
    description: 'Earn yield on Euro',
  },
] as const

export type YoVaultConfig = (typeof YO_VAULTS)[number]

/**
 * Data refresh intervals (in milliseconds)
 */
export const REFRESH_INTERVALS = {
  VAULT_DATA: 5 * 60 * 1000,   // 5 minutes
  BALANCE_DATA: 30 * 1000,      // 30 seconds
  PORTFOLIO_DATA: 30 * 1000,    // 30 seconds
} as const

/**
 * Performance targets
 */
export const PERFORMANCE_TARGETS = {
  FIRST_CONTENTFUL_PAINT: 1500,
  TIME_TO_INTERACTIVE: 3000,
  BUNDLE_SIZE_LIMIT: 200 * 1024,
} as const

/**
 * Risk level colors
 */
export const RISK_COLORS = {
  Low: 'text-success-600 bg-success-50',
  Medium: 'text-warning-600 bg-warning-50',
  High: 'text-danger-600 bg-danger-50',
} as const

/**
 * Transaction status types
 */
export const TX_STATUS = {
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

/**
 * Block explorer URLs
 */
export const BLOCK_EXPLORER = {
  BASE: useTestnet ? 'https://sepolia.basescan.org' : 'https://basescan.org',
} as const

/**
 * yoGateway partner ID — get your own at https://discord.gg/yo-protocol
 */
export const YO_PARTNER_ID = 0 as const
