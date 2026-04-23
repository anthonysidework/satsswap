import { fetchCoinGeckoData } from './coingecko'
import { fetchBRC20Info } from './unisat'
import { TOKEN_LIST } from '@/lib/constants'
import type { Token } from '@/types'

let priceCache: { tokens: Token[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

async function fetchBTCPrice(): Promise<number> {
  try {
    const res = await fetch('https://mempool.space/api/v1/prices', { next: { revalidate: 300 } })
    if (!res.ok) return TOKEN_LIST[0].priceUSD
    const data = await res.json()
    return typeof data?.USD === 'number' ? data.USD : TOKEN_LIST[0].priceUSD
  } catch {
    return TOKEN_LIST[0].priceUSD
  }
}

async function buildLiveTokenList(): Promise<Token[]> {
  const btcUSD = await fetchBTCPrice()

  const [cgResult, unisatResult] = await Promise.allSettled([
    fetchCoinGeckoData(btcUSD),
    fetchBRC20Info(),
  ])

  // Key by tokenId (matches Token.id for Runes, Token.symbol for BRC-20)
  const cgMap = new Map(
    (cgResult.status === 'fulfilled' ? cgResult.value : []).map((d) => [d.tokenId, d])
  )
  const unisatMap = unisatResult.status === 'fulfilled' ? unisatResult.value : new Map()

  return TOKEN_LIST.map((token): Token => {
    if (token.type === 'BTC') {
      return { ...token, priceUSD: btcUSD }
    }

    if (token.type === 'BRC20') {
      // BRC-20: CoinGecko keyed by symbol (ORDI, SATS, RATS)
      const live = cgMap.get(token.symbol)
      if (live && live.priceUSD > 0) {
        return {
          ...token,
          priceBTC: live.priceBTC,
          priceUSD: live.priceUSD,
          change24h: live.change24h,
          volume24h: live.volume24hUSD,
          marketCap: live.marketCapUSD,
          logoUrl: live.logoUrl || token.logoUrl,
        }
      }
      return token
    }

    if (token.type === 'RUNE') {
      // Runes: CoinGecko keyed by token.id (e.g. "DOG•GO•TO•THE•MOON")
      const live = cgMap.get(token.id)
      if (live && live.priceUSD > 0) {
        return {
          ...token,
          priceBTC: live.priceBTC,
          priceUSD: live.priceUSD,
          change24h: live.change24h,
          volume24h: live.volume24hUSD,
          marketCap: live.marketCapUSD,
          // Use live CoinGecko logo if available, fall back to hardcoded constant
          logoUrl: live.logoUrl || token.logoUrl,
        }
      }
      return {
        ...token,
        priceUSD: token.priceBTC * btcUSD,
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
    return priceCache?.tokens ?? TOKEN_LIST
  }
}
