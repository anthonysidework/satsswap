// CoinGecko free tier — no API key, ~30 req/min
//
// Rune logo status (confirmed 2026-04-23):
//   SATOSHI•NAKAMOTO  → image available via /coins/markets ✓
//   RSIC•GENESIS•RUNE → image available via /coins/markets ✓
//   UNCOMMON•GOODS    → image available via /coins/markets ✓
//   DOG•GO•TO•THE•MOON → price only, no image in API (coin exists, detail not indexed)
//   MAGIC•INTERNET•MONEY → price only, no image in API

const BASE = 'https://api.coingecko.com/api/v3'
const CG_CDN = 'https://coin-images.coingecko.com/coins/images'

// BRC-20 — full data via /coins/markets (prices + logos)
export const BRC20_CG_IDS: Record<string, string> = {
  ORDI: 'ordinals',
  SATS: 'sats-ordinals',
  RATS: '1000rats',
}

// Runes split by API capability:
// MARKETS_RUNE_IDS → /coins/markets (prices + logos available)
const MARKETS_RUNE_IDS: Record<string, string> = {
  'SATOSHI•NAKAMOTO': 'satoshi-nakamoto-rune',
  'RSIC•GENESIS•RUNE': 'runecoin',
  'UNCOMMON•GOODS': 'uncommon-goods',
}

// SIMPLE_RUNE_IDS → /simple/price only (no logo in API)
const SIMPLE_RUNE_IDS: Record<string, string> = {
  'DOG•GO•TO•THE•MOON': 'dog-go-to-the-moon-runes',
  'MAGIC•INTERNET•MONEY': 'magic-internet-money-runes',
}

// Full map for chart route + other consumers
export const RUNE_CG_IDS: Record<string, string> = {
  ...MARKETS_RUNE_IDS,
  ...SIMPLE_RUNE_IDS,
}

// Hardcoded fallback logo URLs confirmed from CoinGecko CDN (stable)
export const RUNE_LOGOS: Record<string, string> = {
  'SATOSHI•NAKAMOTO': `${CG_CDN}/37190/small/satoshi-nakamoto-rune.jpeg?1713672566`,
  'RSIC•GENESIS•RUNE': `${CG_CDN}/37157/small/runecoin.jpeg?1713500004`,
  'UNCOMMON•GOODS': `${CG_CDN}/37506/small/Screenshot_2024-05-02_at_10.21.26_AM.png?1714616521`,
}

export interface CoinGeckoData {
  tokenId: string
  priceBTC: number
  priceUSD: number
  change24h: number
  volume24hUSD: number
  marketCapUSD: number
  logoUrl?: string
}

type MarketsResponse = Array<{
  id: string
  image: string
  current_price: number
  market_cap: number
  total_volume: number
  price_change_percentage_24h: number
}>

// BRC-20 + Rune markets tokens in one call (all support /coins/markets)
async function fetchMarketsData(btcUSD: number): Promise<CoinGeckoData[]> {
  const allMarketIds = [
    ...Object.values(BRC20_CG_IDS),
    ...Object.values(MARKETS_RUNE_IDS),
  ].join(',')

  const url = `${BASE}/coins/markets?vs_currency=usd&ids=${allMarketIds}&sparkline=false&price_change_percentage=24h`
  const res = await fetch(url, { next: { revalidate: 300 }, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`CoinGecko /coins/markets failed: ${res.status}`)

  const coins: MarketsResponse = await res.json()

  // Build reverse lookup: CoinGecko ID → our tokenId
  const idToToken: Record<string, string> = {
    ...Object.fromEntries(Object.entries(BRC20_CG_IDS).map(([sym, id]) => [id, sym])),
    ...Object.fromEntries(Object.entries(MARKETS_RUNE_IDS).map(([rid, id]) => [id, rid])),
  }

  return coins.map((coin) => {
    const tokenId = idToToken[coin.id] ?? coin.id
    const priceUSD = coin.current_price ?? 0
    const isRune = tokenId in MARKETS_RUNE_IDS
    return {
      tokenId,
      priceBTC: btcUSD > 0 ? priceUSD / btcUSD : 0,
      priceUSD,
      change24h: coin.price_change_percentage_24h ?? 0,
      volume24hUSD: coin.total_volume ?? 0,
      marketCapUSD: coin.market_cap ?? 0,
      // Use live image from CoinGecko, fall back to hardcoded URL for Runes
      logoUrl: coin.image || (isRune ? RUNE_LOGOS[tokenId] : undefined) || undefined,
    }
  })
}

// DOG + MIM: only simple/price works (no logo via API)
async function fetchSimpleRuneData(btcUSD: number): Promise<CoinGeckoData[]> {
  const ids = Object.values(SIMPLE_RUNE_IDS).join(',')
  const url = `${BASE}/simple/price?ids=${ids}&vs_currencies=usd,btc&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`

  const res = await fetch(url, { next: { revalidate: 300 }, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`CoinGecko simple/price failed: ${res.status}`)

  const data: Record<string, {
    usd: number; btc: number
    usd_24h_change: number; usd_market_cap: number; usd_24h_vol: number
  }> = await res.json()

  const idToTokenId = Object.fromEntries(
    Object.entries(SIMPLE_RUNE_IDS).map(([rid, cgId]) => [cgId, rid])
  )

  return Object.entries(data).map(([cgId, d]) => ({
    tokenId: idToTokenId[cgId] ?? cgId,
    priceBTC: d.btc ?? (btcUSD > 0 ? d.usd / btcUSD : 0),
    priceUSD: d.usd ?? 0,
    change24h: d.usd_24h_change ?? 0,
    volume24hUSD: d.usd_24h_vol ?? 0,
    marketCapUSD: d.usd_market_cap ?? 0,
    // No logo available for DOG/MIM via CoinGecko free API
  }))
}

export async function fetchCoinGeckoData(btcUSD: number): Promise<CoinGeckoData[]> {
  const [markets, simple] = await Promise.allSettled([
    fetchMarketsData(btcUSD),
    fetchSimpleRuneData(btcUSD),
  ])
  return [
    ...(markets.status === 'fulfilled' ? markets.value : []),
    ...(simple.status === 'fulfilled' ? simple.value : []),
  ]
}
