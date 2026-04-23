import type { Token, DexQuote, AggregatedQuote } from '@/types'

export interface QuoteParams {
  fromToken: Token
  toToken: Token
  fromAmount: number
  slippageBps: number
  walletAddress?: string
  networkFeeSats?: number  // injected from real mempool fee estimation
}

export interface DexAdapter {
  name: string
  logoText: string
  logoColor: string
  getQuote(params: QuoteParams): Promise<DexQuote>
}

export type { AggregatedQuote, DexQuote, Token }
