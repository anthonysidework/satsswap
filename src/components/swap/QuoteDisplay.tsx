'use client'
import type { AggregatedQuote } from '@/types'
import { formatAmount, formatUSD, formatSats } from '@/lib/utils'
import { ChevronDown, ChevronUp, Zap, Shield } from 'lucide-react'
import { useState } from 'react'
import { PROTOCOL_FEE_BPS, BTC_USD_PRICE } from '@/lib/constants'

interface QuoteDisplayProps {
  quote: AggregatedQuote
}

export function QuoteDisplay({ quote }: QuoteDisplayProps) {
  const [showAllRoutes, setShowAllRoutes] = useState(false)
  const { bestQuote, quotes, fromToken, toToken, fromAmount } = quote

  const protocolFeeValue = (fromAmount * fromToken.priceBTC * BTC_USD_PRICE * PROTOCOL_FEE_BPS) / 10_000
  const expiresIn = Math.max(0, Math.round((quote.expiresAt - Date.now()) / 1000))

  return (
    <div className="space-y-2">
      {/* Best route summary */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <span className="text-text-secondary text-sm">Best Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded text-white text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: '#F7931A' }}
            >
              {bestQuote.dexLogo}
            </div>
            <span className="text-text-primary text-sm font-semibold">{bestQuote.dex}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-text-muted text-xs mb-1">Rate</div>
            <div className="text-text-primary font-mono">
              1 {fromToken.symbol} = {formatAmount(bestQuote.rate, 6)} {toToken.symbol}
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">Price Impact</div>
            <div className={`font-semibold ${bestQuote.priceImpact > 2 ? 'text-danger' : bestQuote.priceImpact > 1 ? 'text-warning' : 'text-success'}`}>
              {bestQuote.priceImpact.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">DEX Fee</div>
            <div className="text-text-secondary font-mono">{formatUSD(bestQuote.dexFee * BTC_USD_PRICE)}</div>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">Network Fee</div>
            <div className="text-text-secondary font-mono">{formatSats(bestQuote.networkFeeSats)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Shield size={12} />
            <span>Protocol fee: {formatUSD(protocolFeeValue)} (0.15%)</span>
          </div>
          <div className="text-text-muted">
            Expires in <span className={`font-mono ${expiresIn < 10 ? 'text-danger' : 'text-text-secondary'}`}>{expiresIn}s</span>
          </div>
        </div>
      </div>

      {/* All routes toggle */}
      {quotes.length > 1 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowAllRoutes(!showAllRoutes)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>Compare all routes ({quotes.length} DEXes)</span>
            {showAllRoutes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAllRoutes && (
            <div className="border-t border-border divide-y divide-border">
              {quotes.map((q, i) => (
                <div key={q.dex} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? 'bg-primary/5' : ''}`}>
                  <div
                    className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#F7931A22', border: '1px solid #F7931A40' }}
                  >
                    <span style={{ color: '#F7931A' }}>{q.dexLogo}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary text-sm font-medium">{q.dex}</span>
                      {q.isBest && (
                        <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-semibold">BEST</span>
                      )}
                    </div>
                    <div className="text-text-muted text-xs mt-0.5">
                      Impact: {q.priceImpact.toFixed(2)}% · Fee: {formatSats(q.networkFeeSats)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-mono text-sm font-semibold ${q.isBest ? 'text-primary' : 'text-text-secondary'}`}>
                      {formatAmount(q.estimatedOutput, 4)}
                    </div>
                    <div className="text-text-muted text-xs">{toToken.symbol}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
