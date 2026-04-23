import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { SUPPORTED_DEXES, TOKEN_LIST } from '@/lib/constants'
import { formatUSD } from '@/lib/utils'
import { ArrowRight, Shield, Zap, BarChart3, GitMerge } from 'lucide-react'

const STATS = [
  { label: 'Total Volume', value: '$24M+' },
  { label: 'DEXes Aggregated', value: '5' },
  { label: 'Assets Supported', value: '500+' },
  { label: 'Total Swaps', value: '12,400+' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Shield,
    title: 'Connect Your Wallet',
    desc: 'Connect Unisat, Xverse, OKX, or Leather wallet. Non-custodial — your keys, your coins.',
  },
  {
    step: '02',
    icon: GitMerge,
    title: 'Choose Your Swap',
    desc: 'Select any Rune, BRC-20, or BTC pair. We query all DEXes simultaneously.',
  },
  {
    step: '03',
    icon: Zap,
    title: 'Get the Best Price',
    desc: 'SatsSwap finds the best route and routes your swap. Sign once, done.',
  },
]

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Best Execution',
    desc: 'We compare quotes from all major Bitcoin DEXes and route you to the best rate automatically.',
  },
  {
    icon: Shield,
    title: 'Non-Custodial',
    desc: 'All swaps use PSBTs. Your funds never touch our servers. Sign in your wallet, broadcast on-chain.',
  },
  {
    icon: Zap,
    title: 'Multi-Asset Support',
    desc: 'Swap between BTC, Runes, and BRC-20 tokens. Ordinals coming in V2.',
  },
  {
    icon: GitMerge,
    title: 'Split Routing',
    desc: 'Large orders can be split across multiple DEXes to minimize price impact.',
  },
]

export default function Home() {
  const topTokens = TOKEN_LIST.slice(0, 5)

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Now aggregating 5 Bitcoin DEXes
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-text-primary leading-[1.05] mb-6">
            Swap Bitcoin Assets
            <br />
            <span className="text-gradient-orange">at the Best Price</span>
          </h1>

          <p className="text-text-secondary text-xl sm:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed">
            SatsSwap aggregates liquidity from Richswap, Luminex, OKX, Unisat, and Magic Eden.
            Runes, BRC-20, and BTC — one interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/swap">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Launch App <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Explore Assets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="py-8 border-y border-border/50 bg-surface/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-text-primary">{s.value}</div>
                <div className="text-text-muted text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top tokens ticker */}
      <section className="py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
            {topTokens.map((t) => (
              <Link
                key={t.id}
                href={`/swap?from=${encodeURIComponent(t.id)}`}
                className="flex items-center gap-2.5 bg-card border border-border hover:border-border-light rounded-xl px-4 py-3 flex-shrink-0 transition-all hover:shadow-card"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: t.logoColor + '22', border: `1px solid ${t.logoColor}40` }}
                >
                  <span style={{ color: t.logoColor }}>{t.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <div className="text-text-primary text-sm font-semibold">{t.symbol}</div>
                  <div className="text-text-muted text-xs">{formatUSD(t.priceUSD)}</div>
                </div>
                <div className={`text-xs font-semibold ${t.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                  {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-text-primary mb-4">How SatsSwap Works</h2>
            <p className="text-text-secondary text-lg">Three steps to the best Bitcoin asset swap.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative">
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <step.icon size={22} className="text-primary" />
                    </div>
                    <span className="text-5xl font-black text-border">{step.step}</span>
                  </div>
                  <h3 className="text-text-primary font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-4 sm:px-6 bg-surface/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-text-primary mb-4">Built for Bitcoin</h2>
            <p className="text-text-secondary text-lg">Designed for the Bitcoin native asset ecosystem.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-border hover:border-border-light rounded-2xl p-6 transition-all hover:shadow-card group">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={22} className="text-primary" />
                </div>
                <h3 className="text-text-primary font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported DEXes */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-text-muted text-sm uppercase tracking-widest font-medium mb-8">Aggregating Liquidity From</p>
          <div className="flex flex-wrap justify-center gap-4">
            {SUPPORTED_DEXES.map((dex) => (
              <div
                key={dex.name}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3 hover:border-border-light transition-all"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: dex.color }}
                >
                  {dex.logo}
                </div>
                <span className="text-text-primary font-semibold text-sm">{dex.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card border border-primary/20 rounded-2xl p-10 glow-orange">
            <h2 className="text-4xl font-black text-text-primary mb-4">
              Ready to swap at<br />the best price?
            </h2>
            <p className="text-text-secondary mb-8">
              Connect your wallet and start swapping Bitcoin assets with the confidence that you&apos;re getting the best available rate.
            </p>
            <Link href="/swap">
              <Button size="lg" className="gap-2">
                Start Swapping <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
