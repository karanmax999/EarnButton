import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { CONTRACTS, YO_VAULTS } from '../constants'
import { formatUnits } from 'viem'

/**
 * Parameters for useBalance hook
 */
export interface UseBalanceParams {
  /** Ethereum address to fetch balance for */
  address?: `0x${string}`
  
  /** Token type to fetch balance for */
  token: 'USDC' | 'vault' | 'custom'
  
  /** Vault address (required when token is 'vault') */
  vaultAddress?: `0x${string}`

  /** Custom ERC20 token address (required when token is 'custom') */
  customTokenAddress?: `0x${string}`

  /** Decimals for custom token (defaults to 6) */
  customDecimals?: number
}

/**
 * Return type for useBalance hook
 */
export interface UseBalanceReturn {
  /** Raw balance as bigint */
  balance: bigint
  
  /** Formatted balance string with proper decimals */
  formatted: string
  
  /** Loading state */
  isLoading: boolean
  
  /** Error state */
  error: Error | null
  
  /** Function to manually refetch balance */
  refetch: () => Promise<void>
}

/**
 * Custom hook to fetch and format token balances (USDC or vault shares)
 * 
 * @param params - Configuration for balance fetching
 * @returns Balance data with loading and error states
 * 
 * @example
 * ```tsx
 * // Fetch USDC balance
 * const { balance, formatted, isLoading } = useBalance({
 *   address: userAddress,
 *   token: 'USDC'
 * })
 * 
 * // Fetch vault share balance
 * const { balance, formatted, isLoading } = useBalance({
 *   address: userAddress,
 *   token: 'vault',
 *   vaultAddress: '0x...'
 * })
 * ```
 */
export function useBalance(params: UseBalanceParams): UseBalanceReturn {
  const { address: connectedAddress } = useAccount()
  
  // Use provided address or fall back to connected address
  const targetAddress = params.address || connectedAddress
  
  // Determine token address based on token type
  const tokenAddress = params.token === 'USDC'
    ? CONTRACTS.USDC
    : params.token === 'custom'
    ? params.customTokenAddress
    : params.vaultAddress
  
  // Fetch balance using wagmi's useReadContract
  const {
    data: balanceData,
    isLoading,
    error: contractError,
    refetch: contractRefetch,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress && !!tokenAddress,
      // Cache balance data for 30 seconds as per requirements
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
    },
  })
  
  // Extract balance from contract response
  const balance = (balanceData as bigint) || 0n
  
  // Format balance with proper decimals
  // Vault shares use the same decimals as the underlying asset
  const vaultConfig = params.token === 'vault' && params.vaultAddress
    ? YO_VAULTS.find((v) => v.address.toLowerCase() === params.vaultAddress!.toLowerCase())
    : undefined
  const decimals = params.token === 'custom'
    ? (params.customDecimals ?? 6)
    : (vaultConfig?.decimals ?? 6)
  const formatted = formatUnits(balance, decimals)
  
  // Convert contract error to Error type
  const error = contractError ? new Error(contractError.message) : null
  
  // Wrap refetch to match expected signature
  const refetch = async () => {
    await contractRefetch()
  }
  
  return {
    balance,
    formatted,
    isLoading,
    error,
    refetch,
  }
}
