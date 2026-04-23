import type { DexAdapter, QuoteParams } from './types'
import type { DexQuote } from '@/types'

function simulateNetworkDelay(min = 80, max = 400): Promise<void> {
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildMockAdapter(
  name: string,
  logoText: string,
  logoColor: string,
  rateMultiplierRange: [number, number],
  feeBps: number,
  liquidityMultiplier: number
): DexAdapter {
  return {
    name,
    logoText,
    logoColor,
    async getQuote(params: QuoteParams): Promise<DexQuote> {
      await simulateNetworkDelay()

      const [min, max] = rateMultiplierRange
      const multiplier = min + Math.random() * (max - min)
      // Rate = how many toTokens you get per 1 fromToken
      const baseRate = params.fromToken.priceBTC / params.toToken.priceBTC
      const rate = baseRate * multiplier

      const tradeValueBTC = params.fromAmount * params.fromToken.priceBTC
      const priceImpact =
        tradeValueBTC < 0.01
          ? 0.05 + Math.random() * 0.2
          : tradeValueBTC < 0.1
            ? 0.2 + Math.random() * 0.8
            : 1.0 + Math.random() * 2.0

      const dexFee = params.fromAmount * params.fromToken.priceBTC * (feeBps / 10_000)
      const networkFeeSats = Math.floor(1500 + Math.random() * 2000)

      return {
        dex: name,
        dexLogo: logoText,
        rate,
        estimatedOutput: params.fromAmount * rate * (1 - priceImpact / 100),
        priceImpact,
        dexFee,
        networkFeeSats,
        isBest: false,
        liquidityUSD: 500_000 * liquidityMultiplier * (0.8 + Math.random() * 0.4),
      }
    },
  }
}

export const MOCK_ADAPTERS: DexAdapter[] = [
  buildMockAdapter('Richswap', 'R', '#F7931A', [0.998, 1.006], 30, 3.2),
  buildMockAdapter('Luminex', 'L', '#9D4EDD', [0.994, 1.004], 25, 2.1),
  buildMockAdapter('OKX DEX', 'O', '#00B4D8', [0.992, 1.008], 20, 4.5),
  buildMockAdapter('Unisat', 'U', '#4361EE', [0.990, 1.003], 35, 1.8),
  buildMockAdapter('Magic Eden', 'M', '#E83E8C', [0.988, 1.002], 28, 2.7),
]
