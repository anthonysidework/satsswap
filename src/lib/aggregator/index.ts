import type { QuoteParams, AggregatedQuote, DexQuote } from './types'
import { MOCK_ADAPTERS } from './mock'

export async function getAggregatedQuote(params: QuoteParams): Promise<AggregatedQuote> {
  const results = await Promise.allSettled(
    MOCK_ADAPTERS.map((adapter) => adapter.getQuote(params))
  )

  const quotes: DexQuote[] = results
    .filter((r): r is PromiseFulfilledResult<DexQuote> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => b.estimatedOutput - a.estimatedOutput)

  if (quotes.length === 0) throw new Error('No liquidity available for this pair')

  quotes[0].isBest = true

  return {
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    quotes,
    bestQuote: quotes[0],
    expiresAt: Date.now() + 30_000,
  }
}
