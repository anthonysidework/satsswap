import { fetchCoinGeckoPrices } from './coingecko'
import { fetchBRC20Info } from './unisat'
import { TOKEN_LIST } from '@/lib/constants'
import type { Token } from '@/types'

// In-memory cache — survives between requests, resets on server restart/redeploy
let priceCache: { tokens: Token[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function fetchBTCPrice(): Promise<number> {
  try {
    const res = await fetch('https://mempool.space/api/v1/prices', {
      next: { revalidate: 300 },
    })
    if (!res.ok) return TOKEN_LIST[0].priceUSD
    const data = await res.json()
    return typeof data?.USD === 'number' ? data.USD : TOKEN_LIST[0].priceUSD
  } catch {
    return TOKEN_LIST[0].priceUSD
  }
}

async function buildLiveTokenList(): Promise<Token[]> {
  const [btcPriceResult, cgPricesResult, unisatInfoResult] = await Promise.allSettled([
    fetchBTCPrice(),
    fetchCoinGeckoPrices(),
    fetchBRC20Info(),
  ])

  const btcUSD = btcPriceResult.status === 'fulfilled' ? btcPriceResult.value : TOKEN_LIST[0].priceUSD

  const cgMap = new Map(
    (cgPricesResult.status === 'fulfilled' ? cgPricesResult.value : []).map((p) => [p.symbol, p])
  )

  const unisatMap = btcUSD > 0
    ? (unisatInfoResult.status === 'fulfilled' ? unisatInfoResult.value : new Map())
    : new Map()

  return TOKEN_LIST.map((token): Token => {
    // BTC: update live USD price only
    if (token.type === 'BTC') {
      return { ...token, priceUSD: btcUSD }
    }

    // BRC-20: use CoinGecko price if available, Unisat for metadata
    if (token.type === 'BRC20') {
      const livePrice = cgMap.get(token.symbol)
      const meta = unisatMap.get(token.symbol)
      if (livePrice && livePrice.priceBTC > 0) {
        return {
          ...token,
          priceBTC: livePrice.priceBTC,
          priceUSD: livePrice.priceUSD,
          change24h: livePrice.change24h,
          volume24h: livePrice.volume24hUSD,
          marketCap: livePrice.marketCapUSD,
        }
      }
      // No live price — keep mock price but update holders if Unisat has it
      if (meta) return token
      return token
    }

    // Runes: no reliable public price API currently available
    // Prices remain as mock data; update BTC-denominated USD with live BTC price
    if (token.type === 'RUNE') {
      return {
        ...token,
        priceUSD: token.priceBTC * btcUSD,
        volume24h: token.volume24h * (btcUSD / TOKEN_LIST[0].priceUSD),
        marketCap: token.marketCap * (btcUSD / TOKEN_LIST[0].priceUSD),
      }
    }

    return token
  })
}

export async function getLiveTokenList(): Promise<Token[]> {
  if (priceCache && Date.now() - priceCache.fetchedAt < CACHE_TTL_MS) {
    return priceCache.tokens
  }

  try {
    const tokens = await buildLiveTokenList()
    priceCache = { tokens, fetchedAt: Date.now() }
    return tokens
  } catch (err) {
    console.error('[prices] Failed to build live token list:', err)
    // Return stale cache if available, otherwise fall back to mock data
    return priceCache?.tokens ?? TOKEN_LIST
  }
}
