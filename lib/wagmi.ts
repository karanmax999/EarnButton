import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import { http } from 'viem'

const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
const baseSepoliaRpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder-id'

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  console.warn(
    'WalletConnect Project ID is not set. WalletConnect connections will not work. Get one at https://cloud.walletconnect.com'
  )
}

// Testnet mode: set NEXT_PUBLIC_USE_TESTNET=true to use Base Sepolia
const useTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true'

export const config = getDefaultConfig({
  appName: 'EarnButton — YO Protocol',
  projectId: walletConnectProjectId,
  // Mainnet first when not in testnet mode — YO Protocol is mainnet-only
  chains: useTestnet ? [baseSepolia, base] : [base, baseSepolia],
  transports: {
    [base.id]: http(baseRpcUrl),
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
  },
  ssr: true,
})
