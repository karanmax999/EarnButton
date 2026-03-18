import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ToastContainer } from '@/components/Toast'

const inter = Inter({ subsets: ['latin'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://earnbutton.xyz'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'EarnButton — One-tap DeFi Yield on Base',
    template: '%s | EarnButton',
  },
  description:
    'Earn 5–9% APY on USDC, ETH, BTC, and EUR with YO Protocol vaults on Base. Non-custodial, audited, instant exit.',
  keywords: ['DeFi', 'yield', 'Base', 'USDC', 'YO Protocol', 'crypto', 'earn', 'stablecoin', 'passive income'],
  authors: [{ name: 'EarnButton' }],
  creator: 'EarnButton',
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'EarnButton',
    title: 'EarnButton — One-tap DeFi Yield on Base',
    description: 'Earn 5–9% APY on USDC, ETH, BTC, and EUR. Powered by YO Protocol on Base.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'EarnButton — One-tap DeFi Yield on Base',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EarnButton — One-tap DeFi Yield on Base',
    description: 'Earn 5–9% APY on USDC, ETH, BTC, and EUR. Powered by YO Protocol on Base.',
    images: ['/opengraph-image'],
    creator: '@earnbutton',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'EarnButton',
      description: 'One-tap DeFi yield on Base, powered by YO Protocol',
    },
    {
      '@type': 'FinancialProduct',
      '@id': `${APP_URL}/#product`,
      name: 'EarnButton DeFi Yield Vaults',
      description: 'Earn 5–9% APY on USDC, ETH, BTC, and EUR via YO Protocol vaults on Base.',
      url: APP_URL,
      provider: {
        '@type': 'Organization',
        name: 'EarnButton',
        url: APP_URL,
      },
      feesAndCommissionsSpecification: 'Non-custodial. No lock-up. Withdraw anytime.',
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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