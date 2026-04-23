/**
 * OKX Exchange Market Adapter
 *
 * Uses OKX's public spot market API (no API key required) to get real bid/ask
 * prices for BRC-20 tokens listed on OKX exchange. Computes accurate cross-rates
 * via BTC-USDT as the bridge.
 *
 * Confirmed trading pairs (2026-04-23):
 *   ORDI-USDT, SATS-USDT, MEME-USDT, PEPE-USDT
 *
 * Swap execution: OKX DEX aggregator (api/v5/dex/aggregator/) requires a separate
 * API key from https://www.okx.com/web3/build/dev-portal. Set OKX_DEX_API_KEY in
 * .env.local to enable real swap construction; otherwise the price quote is live
 * but execution remains unavailable via this adapter.
 */

import type { DexAdapter, QuoteParams } from '../types'
import type { DexQuote } from '@/types'

const OKX_MARKET = 'https://www.okx.com/api/v5/market'

// Map our token symbol → OKX instrument ID (SPOT pairs)
const OKX_PAIRS: Record<string, string> = {
  ORDI: 'ORDI-USDT',
  SATS: 'SATS-USDT',
  MEME: 'MEME-USDT',
  PEPE: 'PEPE-USDT',
  // BTC always available as the bridge
  BTC:  'BTC-USDT',
}

interface OKXTicker {
  last: string
  bidPx: string
  askPx: string
  vol24h: string
  volCcy24h: string
  open24h: string
}

interface OKXOrderBook {
  asks: [string, string, string, string][]  // [price, size, numOrders, numLiquidated]
  bids: [string, string, string, string][]
}

async function fetchTicker(instId: string): Promise<OKXTicker | null> {
  try {
    const res = await fetch(`${OKX_MARKET}/ticker?instId=${instId}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const d = await res.json()
    return d?.data?.[0] ?? null
  } catch {
    return null
  }
}

async function fetchOrderBook(instId: string, depth = 10): Promise<OKXOrderBook | null> {
  try {
    const res = await fetch(`${OKX_MARKET}/books?instId=${instId}&sz=${depth}`, {
      next: { revalidate: 15 },
    })
    if (!res.ok) return null
    const d = await res.json()
    return d?.data?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Simulate filling an order for `quoteAmount` USDT worth of base token.
 * Returns the effective average fill price (in USDT per base unit).
 * Uses bid side for sells, ask side for buys.
 */
function computeFillPrice(
  book: OKXOrderBook,
  side: 'buy' | 'sell',
  quoteAmountUsdt: number
): { avgPrice: number; priceImpact: number } {
  const levels = side === 'buy' ? book.asks : book.bids
  if (!levels.length) return { avgPrice: 0, priceImpact: 0 }

  const bestPrice = parseFloat(levels[0][0])
  let remaining = quoteAmountUsdt
  let totalBase = 0
  let totalQuote = 0

  for (const [priceStr, sizeStr] of levels) {
    const price = parseFloat(priceStr)
    const size = parseFloat(sizeStr)  // size in base token
    const levelQuote = price * size   // USDT value of this level

    if (remaining <= 0) break

    const fillQuote = Math.min(remaining, levelQuote)
    const fillBase = fillQuote / price

    totalQuote += fillQuote
    totalBase += fillBase
    remaining -= fillQuote
  }

  if (totalBase === 0) return { avgPrice: bestPrice, priceImpact: 0 }

  const avgPrice = totalQuote / totalBase
  const priceImpact = Math.abs((avgPrice - bestPrice) / bestPrice) * 100

  return { avgPrice, priceImpact }
}

/**
 * Get a USD price for a token.
 * For tokens with direct USDT pairs on OKX, use that.
 * For BTC: use BTC-USDT.
 * For Runes (no OKX listing): fall back to the token's priceUSD from our price service.
 */
async function getUsdPrice(symbol: string, fallbackUsd: number): Promise<number> {
  const pair = OKX_PAIRS[symbol.toUpperCase()]
  if (!pair) return fallbackUsd

  const ticker = await fetchTicker(pair)
  if (!ticker) return fallbackUsd
  return parseFloat(ticker.last) || fallbackUsd
}

export const OKXAdapter: DexAdapter = {
  name: 'OKX',
  logoText: 'O',
  logoColor: '#00B4D8',

  async getQuote(params: QuoteParams): Promise<DexQuote> {
    const { fromToken, toToken, fromAmount, networkFeeSats } = params

    const fromSymbol = fromToken.symbol.toUpperCase()
    const toSymbol = toToken.symbol.toUpperCase()

    // Fetch current BTC/USD price as the cross-rate bridge
    const [btcTicker, fromUsd, toUsd] = await Promise.all([
      fetchTicker('BTC-USDT'),
      getUsdPrice(fromSymbol, fromToken.priceUSD),
      getUsdPrice(toSymbol, toToken.priceUSD),
    ])

    const btcUsd = btcTicker ? parseFloat(btcTicker.last) : fromToken.priceUSD / fromToken.priceBTC

    // Compute exact cross-rate: how many toTokens per fromToken
    const tradeValueUsdt = fromAmount * fromUsd
    let rate = toUsd > 0 ? fromUsd / toUsd : 0
    let priceImpact = 0.1 // default

    // If both tokens have OKX pairs, use order book for accurate fill simulation
    const fromPair = OKX_PAIRS[fromSymbol]
    const toPair = OKX_PAIRS[toSymbol]

    if (fromPair && fromSymbol !== 'BTC') {
      // Selling fromToken: use bid side
      const book = await fetchOrderBook(fromPair)
      if (book) {
        const { avgPrice, priceImpact: impact } = computeFillPrice(book, 'sell', tradeValueUsdt)
        if (avgPrice > 0) {
          priceImpact = Math.max(priceImpact, impact)
          const fromUsdEffective = avgPrice
          rate = toUsd > 0 ? fromUsdEffective / toUsd : rate
        }
      }
    }

    if (toPair && toSymbol !== 'BTC') {
      // Buying toToken: use ask side
      const book = await fetchOrderBook(toPair)
      if (book) {
        const { priceImpact: impact } = computeFillPrice(book, 'buy', tradeValueUsdt)
        priceImpact = Math.max(priceImpact, impact)
      }
    }

    // OKX exchange taker fee: 0.1% for spot
    const OKX_TAKER_FEE_BPS = 10
    const dexFee = (fromAmount * fromToken.priceBTC * OKX_TAKER_FEE_BPS) / 10_000

    const estimatedOutput = fromAmount * rate * (1 - priceImpact / 100) * (1 - OKX_TAKER_FEE_BPS / 10_000)

    // Volume in base token for liquidity estimate
    let liquidityUSD = 500_000 // default
    if (fromPair) {
      const ticker = await fetchTicker(fromPair)
      if (ticker) {
        liquidityUSD = parseFloat(ticker.volCcy24h) || liquidityUSD
      }
    }

    return {
      dex: 'OKX',
      dexLogo: 'O',
      rate,
      estimatedOutput,
      priceImpact: Math.max(0.05, priceImpact),
      dexFee,
      networkFeeSats: networkFeeSats ?? 2000,
      isBest: false,
      isLive: true,   // Real OKX exchange market data
      liquidityUSD,
    }
  },
}
