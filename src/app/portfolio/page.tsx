'use client'
import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/Button'
import { formatBTC, formatUSD, truncateAddress } from '@/lib/utils'
import { TOKEN_LIST, BTC_USD_PRICE } from '@/lib/constants'
import { Wallet, ArrowUpRight, Copy } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const MOCK_HOLDINGS = [
  { tokenId: 'DOG•GO•TO•THE•MOON', balance: 4_820_000 },
  { tokenId: 'ORDI', balance: 12.5 },
  { tokenId: 'SATOSHI•NAKAMOTO', balance: 1_250_000_000 },
]

export default function PortfolioPage() {
  const { wallet, openModal } = useWallet()
  const [copied, setCopied] = useState(false)

  function copyAddress() {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (!wallet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-6">
            <Wallet size={36} className="text-text-muted" />
          </div>
          <h1 className="text-2xl font-black text-text-primary mb-3">Connect Your Wallet</h1>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Connect a Bitcoin wallet to view your Runes, BRC-20 tokens, and Ordinals holdings.
          </p>
          <Button onClick={openModal} size="lg" className="w-full">
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  const btcValue = wallet.balanceSats / 1e8
  const btcUSD = btcValue * BTC_USD_PRICE

  const holdings = MOCK_HOLDINGS.map((h) => {
    const token = TOKEN_LIST.find((t) => t.id === h.tokenId)!
    return {
      ...h,
      token,
      valueUSD: h.balance * token.priceUSD,
      valueBTC: h.balance * token.priceBTC,
    }
  })

  const totalUSD = btcUSD + holdings.reduce((s, h) => s + h.valueUSD, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Portfolio</h1>
          <p className="text-text-secondary mt-1">Your Bitcoin asset holdings</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <div>
            <div className="text-text-muted text-xs">Connected via {wallet.provider}</div>
            <div className="text-text-primary font-mono text-sm font-medium">
              {truncateAddress(wallet.address)}
            </div>
          </div>
          <button
            onClick={copyAddress}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded"
          >
            {copied ? (
              <span className="text-success text-xs">Copied!</span>
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Total value */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="text-text-muted text-sm mb-2">Total Portfolio Value</div>
        <div className="text-4xl font-black text-text-primary mb-1">{formatUSD(totalUSD)}</div>
        <div className="text-text-secondary font-mono">{formatBTC(wallet.balanceSats + holdings.reduce((s, h) => s + Math.round(h.valueBTC * 1e8), 0))} BTC</div>
      </div>

      {/* Holdings */}
      <div className="space-y-3">
        {/* BTC */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#F7931A18', border: '1px solid #F7931A35' }}>
            <span style={{ color: '#F7931A' }}>BT</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-text-primary font-semibold">Bitcoin</div>
            <div className="text-text-muted text-sm font-mono">{formatBTC(wallet.balanceSats)} BTC</div>
          </div>
          <div className="text-right">
            <div className="text-text-primary font-bold">{formatUSD(btcUSD)}</div>
            <div className="text-text-muted text-xs">${BTC_USD_PRICE.toLocaleString()} / BTC</div>
          </div>
          <Link href="/swap" className="flex-shrink-0">
            <Button size="sm" variant="secondary">Swap</Button>
          </Link>
        </div>

        {/* Token holdings */}
        {holdings.map((h) => (
          <div key={h.tokenId} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: h.token.logoColor + '18', border: `1px solid ${h.token.logoColor}35` }}
            >
              <span style={{ color: h.token.logoColor }}>{h.token.symbol.slice(0, 2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-text-primary font-semibold">{h.token.symbol}</div>
              <div className="text-text-muted text-sm font-mono">
                {h.balance.toLocaleString()} {h.token.symbol}
              </div>
            </div>
            <div className="text-right">
              <div className="text-text-primary font-bold">{formatUSD(h.valueUSD)}</div>
              <div className={`text-xs mt-0.5 ${h.token.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                {h.token.change24h >= 0 ? '+' : ''}{h.token.change24h.toFixed(2)}% today
              </div>
            </div>
            <Link href={`/swap?from=${encodeURIComponent(h.tokenId)}`} className="flex-shrink-0">
              <Button size="sm" variant="secondary">
                <ArrowUpRight size={14} />
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Empty state for Ordinals */}
      <div className="mt-6 bg-card border border-dashed border-border rounded-2xl p-8 text-center">
        <div className="text-text-muted text-sm mb-1">Ordinals</div>
        <div className="text-text-secondary text-sm">No inscriptions found in this wallet</div>
        <div className="text-text-muted text-xs mt-2">Ordinal collection swaps coming in V2</div>
      </div>
    </div>
  )
}
