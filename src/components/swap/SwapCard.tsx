'use client'
import { useState, useEffect } from 'react'
import { useSwap } from '@/hooks/useSwap'
import { useWallet } from '@/hooks/useWallet'
import { useTokens } from '@/hooks/useTokens'
import { useSearchParams } from 'next/navigation'
import { TokenSelector } from './TokenSelector'
import { QuoteDisplay } from './QuoteDisplay'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TokenLogo } from '@/components/ui/TokenLogo'
import { formatAmount, formatUSD, formatBTC, cn } from '@/lib/utils'
import { ArrowUpDown, Settings, CheckCircle, ExternalLink } from 'lucide-react'
import type { Token } from '@/types'
import { SLIPPAGE_OPTIONS, BTC_USD_PRICE } from '@/lib/constants'

export function SwapCard() {
  const swap = useSwap()
  const { wallet, openModal } = useWallet()
  const { tokens } = useTokens()
  const searchParams = useSearchParams()

  // Pre-populate tokens from URL params (?from=ORDI&to=BTC)
  useEffect(() => {
    const fromId = searchParams.get('from')
    const toId = searchParams.get('to')
    if (fromId && !swap.fromToken) {
      const t = tokens.find((tk) => tk.id === fromId || tk.symbol === fromId)
      if (t) swap.setFromToken(t)
    }
    if (toId && !swap.toToken) {
      const t = tokens.find((tk) => tk.id === toId || tk.symbol === toId)
      if (t) swap.setToToken(t)
    }
  // Only run when tokens load — avoids overwriting user selection on re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens])
  const [showFromSelector, setShowFromSelector] = useState(false)
  const [showToSelector, setShowToSelector] = useState(false)
  const [showSlippage, setShowSlippage] = useState(false)
  const [customSlippage, setCustomSlippage] = useState('')

  const canSwap = swap.fromToken && swap.toToken && swap.fromAmount && swap.quote && !swap.isQuoting && !swap.balanceError
  const toAmount = swap.quote?.bestQuote.estimatedOutput ?? 0

  function handleFromAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9.]/g, '')
    if ((val.match(/\./g) ?? []).length > 1) return
    swap.setFromAmount(val)
  }

  const STEP_LABELS: Record<string, string> = {
    building:     'Getting PSBT...',
    signing:      'Sign in Wallet...',
    broadcasting: 'Broadcasting...',
  }

  function getButtonLabel() {
    if (!wallet) return 'Connect Wallet'
    if (swap.balanceError) return swap.balanceError
    if (!swap.fromToken || !swap.toToken) return 'Select Tokens'
    if (!swap.fromAmount) return 'Enter an Amount'
    if (swap.isQuoting) return 'Getting Best Quote...'
    if (swap.isSwapping) return STEP_LABELS[swap.swapStep] ?? 'Processing...'
    if (swap.quote) return `Swap via ${swap.quote.bestQuote.dex}`
    return 'Get Quote'
  }

  if (swap.txHash) {
    const statusLabel: Record<string, string> = {
      mempool:   'In mempool — awaiting confirmation',
      confirmed: 'Confirmed on Bitcoin',
      failed:    'Transaction failed',
    }
    const statusColor: Record<string, string> = {
      mempool:   'text-warning',
      confirmed: 'text-success',
      failed:    'text-danger',
    }
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-card text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <CheckCircle className="text-success" size={32} />
        </div>
        <div>
          <h3 className="text-text-primary font-bold text-xl">Swap Submitted!</h3>
          {swap.txStatus && (
            <p className={`text-sm mt-1 font-medium ${statusColor[swap.txStatus] ?? 'text-text-secondary'}`}>
              {statusLabel[swap.txStatus] ?? swap.txStatus}
            </p>
          )}
        </div>

        {/* Confirmation steps */}
        <div className="flex items-center justify-center gap-2 text-xs">
          {(['broadcasting', 'mempool', 'confirmed'] as const).map((step, i) => {
            const reached = ['mempool', 'confirmed'].includes(swap.txStatus ?? '') && i <= 1
              || swap.txStatus === 'confirmed' && i <= 2
            return (
              <div key={step} className="flex items-center gap-1">
                {i > 0 && <div className={`w-6 h-px ${reached ? 'bg-success' : 'bg-border'}`} />}
                <div className={`w-2 h-2 rounded-full ${reached ? 'bg-success' : 'bg-border'}`} />
                <span className={reached ? 'text-success' : 'text-text-muted'}>
                  {['Sent', 'Mempool', 'Confirmed'][i]}
                </span>
              </div>
            )
          })}
        </div>

        <a
          href={`https://mempool.space/tx/${swap.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-primary hover:underline text-sm"
        >
          View on Mempool.space
          <ExternalLink size={14} />
        </a>
        <Button onClick={swap.resetSwap} variant="secondary" className="w-full">
          New Swap
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-text-primary font-bold">Swap</h2>
            <p className="text-text-muted text-xs mt-0.5">Best price across 5 DEXes</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSlippage(!showSlippage)}
              className="p-2 rounded-lg hover:bg-surface text-text-muted hover:text-text-secondary transition-colors"
              title="Slippage settings"
            >
              <Settings size={16} />
            </button>

            {showSlippage && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSlippage(false)} />
                <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl p-4 w-64 shadow-card z-20">
                  <div className="text-text-primary text-sm font-semibold mb-3">Slippage Tolerance</div>
                  <div className="flex gap-2 mb-3">
                    {SLIPPAGE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { swap.setSlippage(s); setCustomSlippage(''); setShowSlippage(false) }}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                          swap.slippage === s && !customSlippage
                            ? 'bg-primary/15 text-primary'
                            : 'bg-surface text-text-secondary hover:text-text-primary'
                        )}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Custom %"
                      value={customSlippage}
                      onChange={(e) => {
                        setCustomSlippage(e.target.value)
                        const v = parseFloat(e.target.value)
                        if (!isNaN(v) && v > 0 && v <= 50) swap.setSlippage(v)
                      }}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* From token */}
        <div className="p-4">
          <TokenInputBox
            label="From"
            token={swap.fromToken}
            amount={swap.fromAmount}
            onAmountChange={handleFromAmountChange}
            onTokenClick={() => setShowFromSelector(true)}
            wallet={wallet}
          />

          {/* Flip button */}
          <div className="flex justify-center my-2">
            <button
              onClick={swap.flipTokens}
              className="w-9 h-9 rounded-xl bg-surface border border-border hover:border-border-light hover:bg-card flex items-center justify-center text-text-muted hover:text-primary transition-all"
            >
              <ArrowUpDown size={16} />
            </button>
          </div>

          {/* To token */}
          <TokenInputBox
            label="To"
            token={swap.toToken}
            amount={toAmount > 0 ? formatAmount(toAmount, 8) : ''}
            onAmountChange={() => {}}
            onTokenClick={() => setShowToSelector(true)}
            readOnly
            loading={swap.isQuoting}
          />
        </div>

        {/* Rate preview */}
        {swap.fromToken && swap.toToken && swap.quote && (
          <div className="px-4 pb-1">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>
                1 {swap.fromToken.symbol} ≈ {formatAmount(swap.quote.bestQuote.rate, 6)} {swap.toToken.symbol}
              </span>
              <span>{formatUSD(swap.fromToken.priceUSD)}</span>
            </div>
          </div>
        )}

        {/* Swap button */}
        <div className="p-4 pt-3">
          <Button
            className="w-full"
            size="lg"
            loading={swap.isQuoting || swap.isSwapping}
            disabled={(!!wallet && !canSwap) || !!swap.balanceError}
            variant={swap.balanceError ? 'danger' : 'primary'}
            onClick={!wallet ? openModal : swap.executeSwap}
          >
            {getButtonLabel()}
          </Button>
          {swap.error && (
            <p className="text-danger text-xs text-center mt-2">{swap.error}</p>
          )}
        </div>
      </div>

      {/* Quote display below card */}
      {swap.quote && (
        <div className="mt-3">
          <QuoteDisplay
            quote={swap.quote}
            onExpired={() => {
              // Auto-refresh when quote expires — re-triggers debounced fetch
              if (swap.fromToken && swap.toToken && swap.fromAmount) {
                swap.setFromAmount(swap.fromAmount)
              }
            }}
          />
        </div>
      )}

      {/* Loading skeleton for quote */}
      {swap.isQuoting && !swap.quote && (
        <div className="mt-3 space-y-2">
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-border rounded w-1/3" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 bg-border rounded w-1/2 mb-2" />
                  <div className="h-4 bg-border rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showFromSelector && (
        <TokenSelector
          onSelect={swap.setFromToken}
          onClose={() => setShowFromSelector(false)}
          excludeId={swap.toToken?.id}
        />
      )}
      {showToSelector && (
        <TokenSelector
          onSelect={swap.setToToken}
          onClose={() => setShowToSelector(false)}
          excludeId={swap.fromToken?.id}
        />
      )}
    </>
  )
}

interface TokenInputBoxProps {
  label: string
  token: Token | null
  amount: string
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTokenClick: () => void
  readOnly?: boolean
  loading?: boolean
  wallet?: { balanceSats: number } | null
}

function TokenInputBox({ label, token, amount, onAmountChange, onTokenClick, readOnly, loading, wallet }: TokenInputBoxProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted text-xs">{label}</span>
        {token && wallet && !readOnly && (
          <span className="text-text-muted text-xs">
            Bal: {token.type === 'BTC'
              ? formatBTC(wallet.balanceSats) + ' BTC'
              : '—'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={loading ? '' : amount}
          onChange={onAmountChange}
          readOnly={readOnly}
          className={cn(
            'flex-1 bg-transparent text-2xl font-bold text-text-primary placeholder:text-border focus:outline-none min-w-0',
            readOnly && 'cursor-default',
            loading && 'animate-pulse'
          )}
        />
        <button
          onClick={onTokenClick}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0 border transition-all text-sm font-semibold',
            token
              ? 'bg-card border-border hover:border-border-light text-text-primary'
              : 'bg-primary text-black border-transparent hover:bg-primary-dark shadow-orange'
          )}
        >
          {token ? (
            <>
              <TokenLogo token={token} size={24} />
              <span>{token.symbol}</span>
              <Badge
                variant={token.type === 'RUNE' ? 'rune' : token.type === 'BRC20' ? 'brc20' : 'btc'}
                className="hidden sm:inline-flex"
              >
                {token.type === 'BRC20' ? 'BRC-20' : token.type}
              </Badge>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          ) : (
            <>Select token <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg></>
          )}
        </button>
      </div>
      {token && amount && !readOnly && (
        <div className="text-text-muted text-xs mt-2">
          ≈ {formatUSD(parseFloat(amount) * token.priceUSD)}
        </div>
      )}
      {token && amount && readOnly && !loading && (
        <div className="text-text-muted text-xs mt-2">
          ≈ {formatUSD(parseFloat(amount) * token.priceUSD)}
        </div>
      )}
    </div>
  )
}
