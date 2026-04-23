'use client'
import { useState } from 'react'
import { TokenTable } from '@/components/explore/TokenTable'
import { TOKEN_LIST } from '@/lib/constants'
import { formatUSD } from '@/lib/utils'
import type { AssetType } from '@/types'
import { Search } from 'lucide-react'

type FilterTab = 'ALL' | AssetType

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All Assets' },
  { key: 'RUNE', label: 'Runes' },
  { key: 'BRC20', label: 'BRC-20' },
  { key: 'BTC', label: 'Bitcoin' },
]

const totalVolume = TOKEN_LIST.reduce((s, t) => s + t.volume24h, 0)
const totalMarketCap = TOKEN_LIST.reduce((s, t) => s + t.marketCap, 0)

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary">Explore</h1>
        <p className="text-text-secondary mt-2">
          Track prices and activity across Bitcoin&apos;s native asset ecosystem.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tokens Listed', value: TOKEN_LIST.length.toString() },
          { label: '24h Volume', value: formatUSD(totalVolume) },
          { label: 'Total Market Cap', value: formatUSD(totalMarketCap) },
          { label: 'Runes', value: TOKEN_LIST.filter((t) => t.type === 'RUNE').length.toString() },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-text-muted text-xs mb-1">{s.label}</div>
            <div className="text-text-primary font-bold text-xl">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Token table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border-b border-border">
          <div className="flex gap-1 flex-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              readOnly
              className="w-full bg-surface border border-border rounded-xl pl-8 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none cursor-default"
            />
          </div>
        </div>

        <TokenTable filter={activeTab === 'ALL' ? 'ALL' : activeTab} />
      </div>
    </div>
  )
}
