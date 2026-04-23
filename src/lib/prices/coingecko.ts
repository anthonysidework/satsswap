// CoinGecko free tier — no API key, ~30 req/min
// Tracks prices AND logo URLs for BRC-20 tokens listed on CoinGecko

const BASE = 'https://api.coingecko.com/api/v3'

// Our token symbol → CoinGecko coin ID mapping (confirmed 2025-04-22)
export const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ORDI: 'ordinals',
  SATS: 'sats-ordinals',
  RATS: '1000rats',
}

export interface CoinGeckoData {
  symbol: string
  priceBTC: number
  priceUSD: number
  change24h: number
  volume24hUSD: number
  marketCapUSD: number
  logoUrl: string
}

export async function fetchCoinGeckoData(btcUSD: number): Promise<CoinGeckoData[]> {
  // Exclude BTC itself — we get its USD price from mempool.space
  const altcoinIds = Object.entries(COINGECKO_IDS)
    .filter(([sym]) => sym !== 'BTC')
    .map(([, id]) => id)
    .join(',')

  const url = `${BASE}/coins/markets?vs_currency=usd&ids=${altcoinIds}&sparkline=false&price_change_percentage=24h`

  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`CoinGecko /coins/markets failed: ${res.status}`)

  const coins: Array<{
    id: string
    symbol: string
    image: string
    current_price: number
    market_cap: number
    total_volume: number
    price_change_percentage_24h: number
  }> = await res.json()

  // Reverse-lookup: CoinGecko ID → our token symbol
  const idToSymbol = Object.fromEntries(
    Object.entries(COINGECKO_IDS).map(([sym, id]) => [id, sym])
  )

  return coins.map((coin) => {
    const symbol = idToSymbol[coin.id] ?? coin.symbol.toUpperCase()
    const priceUSD = coin.current_price ?? 0
    return {
      symbol,
      priceBTC: btcUSD > 0 ? priceUSD / btcUSD : 0,
      priceUSD,
      change24h: coin.price_change_percentage_24h ?? 0,
      volume24hUSD: coin.total_volume ?? 0,
      marketCapUSD: coin.market_cap ?? 0,
      logoUrl: coin.image ?? '',
    }
  })
}
