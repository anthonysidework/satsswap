// CoinGecko free tier — no API key, ~30 req/min
// Covers BRC-20 tokens (via /coins/markets for images + prices) and
// Runes (via /simple/price — no images available on CoinGecko for Runes yet)

const BASE = 'https://api.coingecko.com/api/v3'

// BRC-20 tokens — listed on CoinGecko with images
export const BRC20_CG_IDS: Record<string, string> = {
  ORDI: 'ordinals',
  SATS: 'sats-ordinals',
  RATS: '1000rats',
}

// Rune tokens — listed on CoinGecko (prices only, no images)
// IDs confirmed 2025-04-22
export const RUNE_CG_IDS: Record<string, string> = {
  'DOG•GO•TO•THE•MOON': 'dog-go-to-the-moon-runes',
  'SATOSHI•NAKAMOTO': 'satoshi-nakamoto-rune',
  'RSIC•GENESIS•RUNE': 'runecoin',
  'UNCOMMON•GOODS': 'uncommon-goods',
  'MAGIC•INTERNET•MONEY': 'magic-internet-money-runes',
}

export interface CoinGeckoData {
  tokenId: string   // matches Token.id in our list
  priceBTC: number
  priceUSD: number
  change24h: number
  volume24hUSD: number
  marketCapUSD: number
  logoUrl?: string
}

// Fetch BRC-20 prices + logo images via /coins/markets
async function fetchBRC20Data(btcUSD: number): Promise<CoinGeckoData[]> {
  const ids = Object.values(BRC20_CG_IDS).join(',')
  const url = `${BASE}/coins/markets?vs_currency=usd&ids=${ids}&sparkline=false&price_change_percentage=24h`

  const res = await fetch(url, { next: { revalidate: 300 }, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`CoinGecko BRC-20 markets failed: ${res.status}`)

  const coins: Array<{
    id: string
    image: string
    current_price: number
    market_cap: number
    total_volume: number
    price_change_percentage_24h: number
  }> = await res.json()

  const idToSymbol = Object.fromEntries(Object.entries(BRC20_CG_IDS).map(([sym, id]) => [id, sym]))

  return coins.map((coin) => {
    const symbol = idToSymbol[coin.id]
    const priceUSD = coin.current_price ?? 0
    return {
      tokenId: symbol,
      priceBTC: btcUSD > 0 ? priceUSD / btcUSD : 0,
      priceUSD,
      change24h: coin.price_change_percentage_24h ?? 0,
      volume24hUSD: coin.total_volume ?? 0,
      marketCapUSD: coin.market_cap ?? 0,
      logoUrl: coin.image || undefined,
    }
  })
}

// Fetch Rune prices via /simple/price (no image data available for Runes on CoinGecko)
async function fetchRuneData(btcUSD: number): Promise<CoinGeckoData[]> {
  const ids = Object.values(RUNE_CG_IDS).join(',')
  const url = `${BASE}/simple/price?ids=${ids}&vs_currencies=usd,btc&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`

  const res = await fetch(url, { next: { revalidate: 300 }, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`CoinGecko Runes simple/price failed: ${res.status}`)

  const data: Record<string, {
    usd: number
    btc: number
    usd_24h_change: number
    usd_market_cap: number
    usd_24h_vol: number
  }> = await res.json()

  const idToRuneId = Object.fromEntries(Object.entries(RUNE_CG_IDS).map(([rid, cgId]) => [cgId, rid]))

  return Object.entries(data).map(([cgId, d]) => ({
    tokenId: idToRuneId[cgId] ?? cgId,
    priceBTC: d.btc ?? (btcUSD > 0 ? d.usd / btcUSD : 0),
    priceUSD: d.usd ?? 0,
    change24h: d.usd_24h_change ?? 0,
    volume24hUSD: d.usd_24h_vol ?? 0,
    marketCapUSD: d.usd_market_cap ?? 0,
  }))
}

export async function fetchCoinGeckoData(btcUSD: number): Promise<CoinGeckoData[]> {
  // Stagger requests slightly to avoid hitting rate limit
  const brc20 = await fetchBRC20Data(btcUSD).catch(() => [] as CoinGeckoData[])
  const runes = await fetchRuneData(btcUSD).catch(() => [] as CoinGeckoData[])
  return [...brc20, ...runes]
}
