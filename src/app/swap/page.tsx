import { Suspense } from 'react'
import { SwapCard } from '@/components/swap/SwapCard'
import { SwapSidebar } from '@/components/swap/SwapSidebar'
import { getLiveTokenList } from '@/lib/prices'

export default async function SwapPage() {
  const liveTokens = await getLiveTokenList()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-[460px] flex-shrink-0">
          {/* Suspense required by useSearchParams inside SwapCard */}
          <Suspense fallback={<div className="bg-card border border-border rounded-2xl h-80 animate-pulse" />}>
            <SwapCard />
          </Suspense>
        </div>
        <SwapSidebar initialTokens={liveTokens} />
      </div>
    </div>
  )
}
