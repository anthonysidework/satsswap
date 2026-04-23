import { SwapCard } from '@/components/swap/SwapCard'
import { TokenLogo } from '@/components/ui/TokenLogo'
import { getLiveTokenList } from '@/lib/prices'
import { formatUSD } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default async function SwapPage() {
  const liveTokens = await getLiveTokenList()
  const trending = liveTokens.filter((t) => t.type !== 'BTC').slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Swap widget */}
        <div className="w-full lg:w-[480px] flex-shrink-0">
          <SwapCard />
        </div>

        {/* Right: Info panels */}
        <div className="flex-1 space-y-5">
          {/* Why SatsSwap */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-text-primary font-bold mb-4 text-lg">Why SatsSwap?</h3>
            <div className="space-y-4">
              {[
                {
                  title: 'Best Price Guaranteed',
                  desc: 'We query 5 DEXes simultaneously and route your swap to the best rate. No more manually checking each platform.',
                },
                {
                  title: '100% Non-Custodial',
                  desc: 'Swaps are signed via PSBT in your own wallet. SatsSwap never holds your funds.',
                },
                {
                  title: 'One Tiny Protocol Fee',
                  desc: "We charge 0.15% on successful swaps. That's it. No hidden fees, no spread markup.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="text-text-primary font-semibold text-sm">{item.title}</div>
                    <div className="text-text-muted text-xs mt-1 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending tokens */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-text-primary font-bold mb-4 text-lg">Trending</h3>
            <div className="space-y-3">
              {trending.map((token) => (
                <div key={token.id} className="flex items-center gap-3">
                  <TokenLogo token={token} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-text-primary text-sm font-semibold">{token.symbol}</div>
                    <div className="text-text-muted text-xs truncate">{token.name}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-text-primary font-mono text-sm">{formatUSD(token.priceUSD)}</div>
                    <div className={`flex items-center justify-end gap-1 text-xs ${token.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                      {token.change24h >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(token.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Swap guide */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <h4 className="text-primary font-semibold text-sm mb-2">How to swap</h4>
            <ol className="text-text-secondary text-xs space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Connect your Bitcoin wallet using the button in the top-right</li>
              <li>Select the token you want to swap from and to</li>
              <li>Enter an amount — we&apos;ll fetch quotes from all DEXes</li>
              <li>Review the best price and confirm in your wallet</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
