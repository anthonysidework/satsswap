'use client'
import { useState } from 'react'
import { useTokens } from '@/hooks/useTokens'
import { formatUSD, formatAmount } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { TokenLogo } from '@/components/ui/TokenLogo'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import type { AssetType } from '@/types'

type SortKey = 'priceUSD' | 'change24h' | 'volume24h' | 'marketCap'
type SortDir = 'asc' | 'desc'

export function TokenTable({ filter }: { filter: AssetType | 'ALL' }) {
  const [sortKey, setSortKey] = useState<SortKey>('volume24h')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const { tokens: allTokens, isLive } = useTokens()

  const tokens = allTokens.filter((t) => {
    if (filter === 'ALL') return true
    return t.type === filter
  }).sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1
    return (a[sortKey] - b[sortKey]) * dir
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-text-muted hover:text-text-secondary transition-colors text-xs font-medium"
    >
      {label}
      <ArrowUpDown size={11} className={sortKey === k ? 'text-primary' : ''} />
    </button>
  )

  return (
    <div className="overflow-x-auto">
      {isLive && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-success/5 text-success text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live prices
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-text-muted text-xs font-medium w-8">#</th>
            <th className="text-left px-4 py-3 text-text-muted text-xs font-medium">Token</th>
            <th className="text-right px-4 py-3"><SortHeader label="Price" k="priceUSD" /></th>
            <th className="text-right px-4 py-3"><SortHeader label="24h %" k="change24h" /></th>
            <th className="text-right px-4 py-3 hidden md:table-cell"><SortHeader label="Volume 24h" k="volume24h" /></th>
            <th className="text-right px-4 py-3 hidden lg:table-cell"><SortHeader label="Market Cap" k="marketCap" /></th>
            <th className="text-right px-4 py-3 w-24" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tokens.map((token, i) => (
            <tr key={token.id} className="hover:bg-surface/50 transition-colors group">
              <td className="px-4 py-4 text-text-muted text-sm">{i + 1}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <TokenLogo token={token} size={36} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-semibold text-sm">{token.symbol}</span>
                      <Badge variant={token.type === 'RUNE' ? 'rune' : token.type === 'BRC20' ? 'brc20' : 'btc'}>
                        {token.type === 'BRC20' ? 'BRC-20' : token.type}
                      </Badge>
                    </div>
                    <div className="text-text-muted text-xs mt-0.5 truncate max-w-[180px]">{token.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="text-text-primary font-mono text-sm">{formatUSD(token.priceUSD)}</div>
                <div className="text-text-muted text-xs font-mono mt-0.5">
                  {formatAmount(token.priceBTC, 8)} BTC
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${token.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                  {token.change24h >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {Math.abs(token.change24h).toFixed(2)}%
                </div>
              </td>
              <td className="px-4 py-4 text-right hidden md:table-cell text-text-secondary text-sm font-mono">
                {formatUSD(token.volume24h)}
              </td>
              <td className="px-4 py-4 text-right hidden lg:table-cell text-text-secondary text-sm font-mono">
                {formatUSD(token.marketCap)}
              </td>
              <td className="px-4 py-4 text-right">
                <Link
                  href={`/swap?from=${encodeURIComponent(token.id)}`}
                  className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors opacity-0 group-hover:opacity-100"
                >
                  Swap
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
