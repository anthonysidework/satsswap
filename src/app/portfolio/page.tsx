'use client'
import { useWallet } from '@/hooks/useWallet'
import { useTokens } from '@/hooks/useTokens'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { TokenLogo } from '@/components/ui/TokenLogo'
import { formatBTC, formatUSD, truncateAddress } from '@/lib/utils'
import { Wallet, ArrowUpRight, Copy, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface PortfolioHolding {
  tokenId: string
  symbol: string
  type: 'BRC20' | 'RUNE'
  balance: number
  valueUSD: number
  valueBTC: number
  change24h: number
  logoColor: string
  logoUrl?: string
}

function HoldingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-border flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-border rounded w-20" />
        <div className="h-3 bg-border rounded w-32" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-4 bg-border rounded w-16 ml-auto" />
        <div className="h-3 bg-border rounded w-12 ml-auto" />
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  // All hooks unconditionally at top — never after a conditional return
  const { wallet, openModal } = useWallet()
  const { tokens: liveTokens } = useTokens()
  const [copied, setCopied] = useState(false)
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [runesNote, setRunesNote] = useState<string | null>(null)
  const [holdingsLoading, setHoldingsLoading] = useState(false)
  const [holdingsError, setHoldingsError] = useState(false)
  const [lastFetched, setLastFetched] = useState<string | null>(null)

  useEffect(() => {
    if (!wallet?.address) {
      setHoldings([])
      return
    }
    if (wallet.address === lastFetched) return

    setHoldingsLoading(true)
    setHoldingsError(false)

    fetch(`/api/portfolio?address=${encodeURIComponent(wallet.address)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((data) => {
        setHoldings(data.holdings ?? [])
        setRunesNote(data.runesInfo?.reason ?? null)
        setLastFetched(wallet.address)
        setHoldingsLoading(false)
      })
      .catch(() => {
        setHoldingsError(true)
        setHoldingsLoading(false)
      })
  }, [wallet?.address, lastFetched])

  function refresh() {
    setLastFetched(null)
  }

  function copyAddress() {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  // Conditional render after all hooks
  if (!wallet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-6">
            <Wallet size={36} className="text-text-muted" />
          </div>
          <h1 className="text-2xl font-black text-text-primary mb-3">Connect Your Wallet</h1>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Connect a Bitcoin wallet to view your live Runes, BRC-20, and Bitcoin holdings.
          </p>
          <Button onClick={openModal} size="lg" className="w-full">
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  // Derive values from live token prices
  const btcToken = liveTokens.find((t) => t.id === 'BTC')
  const btcPriceUSD = btcToken?.priceUSD ?? 77905
  const btcValueUSD = (wallet.balanceSats / 1e8) * btcPriceUSD
  const tokensTotalUSD = holdings.reduce((s, h) => s + h.valueUSD, 0)
  const totalUSD = btcValueUSD + tokensTotalUSD

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Portfolio</h1>
          <p className="text-text-secondary mt-1">Live holdings for your connected wallet</p>
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
              <span className="text-success text-xs font-medium">Copied!</span>
            ) : (
              <Copy size={14} />
            )}
          </button>
          <button
            onClick={refresh}
            disabled={holdingsLoading}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded disabled:opacity-40"
            title="Refresh balances"
          >
            <RefreshCw size={14} className={holdingsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Total value */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="text-text-muted text-sm mb-2">Total Portfolio Value</div>
        <div className="text-4xl font-black text-text-primary mb-1">
          {holdingsLoading ? (
            <div className="h-10 bg-border rounded w-40 animate-pulse" />
          ) : (
            formatUSD(totalUSD)
          )}
        </div>
        <div className="text-text-secondary font-mono text-sm">
          {formatBTC(wallet.balanceSats)} BTC
        </div>
      </div>

      {/* Holdings */}
      <div className="space-y-3">
        {/* BTC — always shown from wallet connection */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          {btcToken && <TokenLogo token={btcToken} size={40} />}
          <div className="flex-1 min-w-0">
            <div className="text-text-primary font-semibold">Bitcoin</div>
            <div className="text-text-muted text-sm font-mono">{formatBTC(wallet.balanceSats)} BTC</div>
          </div>
          <div className="text-right">
            <div className="text-text-primary font-bold">{formatUSD(btcValueUSD)}</div>
            <div className="text-text-muted text-xs">{formatUSD(btcPriceUSD)} / BTC</div>
          </div>
          <Link href="/swap" className="flex-shrink-0">
            <Button size="sm" variant="secondary">Swap</Button>
          </Link>
        </div>

        {/* BRC-20 holdings from Unisat */}
        {holdingsLoading ? (
          <>
            <HoldingSkeleton />
            <HoldingSkeleton />
          </>
        ) : holdingsError ? (
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-text-muted text-sm">Could not load token balances.</p>
            <button onClick={refresh} className="text-primary text-sm mt-2 hover:underline">
              Try again
            </button>
          </div>
        ) : holdings.length > 0 ? (
          holdings.map((h) => {
            const token = liveTokens.find((t) => t.id === h.tokenId)
            return (
              <div key={h.tokenId} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                {token ? (
                  <TokenLogo token={token} size={40} />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: h.logoColor + '18', border: `1px solid ${h.logoColor}35`, color: h.logoColor }}
                  >
                    {h.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-semibold">{h.symbol}</div>
                  <div className="text-text-muted text-sm font-mono">
                    {h.balance.toLocaleString()} {h.symbol}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-text-primary font-bold">{formatUSD(h.valueUSD)}</div>
                  <div className={`text-xs mt-0.5 ${h.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                    {h.change24h >= 0 ? '+' : ''}{h.change24h.toFixed(2)}% today
                  </div>
                </div>
                <Link href={`/swap?from=${encodeURIComponent(h.tokenId)}`} className="flex-shrink-0">
                  <Button size="sm" variant="secondary">
                    <ArrowUpRight size={14} />
                  </Button>
                </Link>
              </div>
            )
          })
        ) : (
          <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
            <div className="text-text-muted text-sm">No BRC-20 tokens found in this wallet</div>
          </div>
        )}

        {/* Rune balances — no free public indexer currently available */}
        {runesNote && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-5">
            <div className="text-text-secondary text-sm font-medium mb-1">Rune Balances</div>
            <div className="text-text-muted text-xs leading-relaxed">{runesNote}</div>
          </div>
        )}
      </div>
    </div>
  )
}
