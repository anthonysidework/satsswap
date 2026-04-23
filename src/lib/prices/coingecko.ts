// CoinGecko free tier — no API key needed, rate limited to ~30 calls/min
// Only ORDI and SATS are listed on CoinGecko; others fall back to mock data

const BASE = 'https://api.coingecko.com/api/v3'

// Map our token symbols to CoinGecko coin IDs
export const COINGECKO_IDS: Record<string, string> = {
  ORDI: 'ordinals',
  SATS: 'sats-ordinals',
}

export interface CoinGeckoPrice {
  symbol: string
  priceBTC: number
  priceUSD: number
  change24h: number
  volume24hUSD: number
  marketCapUSD: number
}

export async function fetchCoinGeckoPrices(): Promise<CoinGeckoPrice[]> {
  const ids = Object.values(COINGECKO_IDS).join(',')
  const url = `${BASE}/simple/price?ids=${ids}&vs_currencies=usd,btc&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`

  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`CoinGecko fetch failed: ${res.status}`)

  const data: Record<string, {
    usd: number
    btc: number
    usd_24h_vol: number
    usd_24h_change: number
    usd_market_cap: number
  }> = await res.json()

  return Object.entries(COINGECKO_IDS).map(([symbol, cgId]) => {
    const d = data[cgId]
    if (!d) return null
    return {
      symbol,
      priceBTC: d.btc ?? 0,
      priceUSD: d.usd ?? 0,
      change24h: d.usd_24h_change ?? 0,
      volume24hUSD: d.usd_24h_vol ?? 0,
      marketCapUSD: d.usd_market_cap ?? 0,
    }
  }).filter((x): x is CoinGeckoPrice => x !== null)
}
