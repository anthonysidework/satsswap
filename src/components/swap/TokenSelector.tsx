'use client'
import { useState, useMemo } from 'react'
import { useTokens } from '@/hooks/useTokens'
import type { Token } from '@/types'
import { formatUSD } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface TokenSelectorProps {
  onSelect: (token: Token) => void
  onClose: () => void
  excludeId?: string
}

type FilterTab = 'ALL' | 'RUNE' | 'BRC20' | 'BTC'

export function TokenSelector({ onSelect, onClose, excludeId }: TokenSelectorProps) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<FilterTab>('ALL')
  const { tokens } = useTokens()

  const filtered = useMemo(() => {
    return tokens.filter((t) => {
      if (t.id === excludeId) return false
      if (tab !== 'ALL' && t.type !== tab) return false
      if (query) {
        const q = query.toLowerCase()
        return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
      }
      return true
    })
  }, [query, tab, excludeId])

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'BTC', label: 'BTC' },
    { key: 'RUNE', label: 'Runes' },
    { key: 'BRC20', label: 'BRC-20' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md shadow-card flex flex-col max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-text-primary font-bold text-lg">Select Token</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-border transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              type="text"
              placeholder="Search tokens..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Token list */}
        <div className="overflow-y-auto flex-1 px-2 pb-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm">No tokens found</div>
          ) : (
            filtered.map((token) => (
              <button
                key={token.id}
                onClick={() => { onSelect(token); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: token.logoColor + '22', border: `1px solid ${token.logoColor}40` }}
                >
                  <span style={{ color: token.logoColor }}>{token.symbol.slice(0, 2)}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-semibold text-sm">{token.symbol}</span>
                    <Badge
                      variant={token.type === 'RUNE' ? 'rune' : token.type === 'BRC20' ? 'brc20' : 'btc'}
                    >
                      {token.type === 'BRC20' ? 'BRC-20' : token.type}
                    </Badge>
                  </div>
                  <div className="text-text-muted text-xs truncate mt-0.5">{token.name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-text-primary text-sm font-mono">{formatUSD(token.priceUSD)}</div>
                  <div className={`text-xs mt-0.5 ${token.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
