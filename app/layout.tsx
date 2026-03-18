import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ToastContainer } from '@/components/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EarnButton — One-tap DeFi Yield on Base',
  description: 'Earn 5–9% APY on USDC, ETH, BTC, and EUR with YO Protocol vaults on Base. Non-custodial, audited, instant exit.',
  keywords: ['DeFi', 'yield', 'Base', 'USDC', 'YO Protocol', 'crypto', 'earn'],
  openGraph: {
    title: 'EarnButton — One-tap DeFi Yield on Base',
    description: 'Earn 5–9% APY on USDC, ETH, BTC, and EUR. Powered by YO Protocol.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>
            <ToastContainer>
              {children}
            </ToastContainer>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
