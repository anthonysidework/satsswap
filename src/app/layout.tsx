import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WalletModal } from '@/components/wallet/WalletModal'

export const metadata: Metadata = {
  title: 'SatsSwap — Best Price Across All Bitcoin DEXes',
  description:
    'Swap Bitcoin Ordinals, BRC-20 tokens, and Runes at the best available price. SatsSwap aggregates liquidity across Richswap, Luminex, OKX, Unisat, and Magic Eden.',
  keywords: ['Bitcoin', 'Ordinals', 'Runes', 'BRC-20', 'DEX', 'Swap', 'Non-custodial'],
  openGraph: {
    title: 'SatsSwap — Best Price Across All Bitcoin DEXes',
    description: 'Non-custodial Bitcoin asset swaps. Best price, always.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Header />
        <WalletModal />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
