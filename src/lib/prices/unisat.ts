// Unisat Open API — confirmed working endpoint for BRC-20 token metadata
// Provides: holdersCount, totalMinted, decimal, deployHeight
// Price data not available through this API tier — use CoinGecko for prices

const BASE = 'https://open-api.unisat.io'

const BRC20_TICKERS = ['ordi', 'sats', 'rats', 'meme', 'pepe']

export interface UnisatTokenInfo {
  ticker: string
  holders: number
  totalSupply: string
  decimals: number
}

async function fetchTickerInfo(ticker: string): Promise<UnisatTokenInfo | null> {
  const key = process.env.UNISAT_API_KEY
  if (!key) return null

  const res = await fetch(`${BASE}/v1/indexer/brc20/${ticker}/info`, {
    headers: { Authorization: `Bearer ${key}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) return null

  const json = await res.json()
  if (json?.code !== 0 || !json?.data) return null

  const d = json.data
  return {
    ticker: d.ticker as string,
    holders: d.holdersCount as number ?? 0,
    totalSupply: d.totalMinted as string ?? '0',
    decimals: d.decimal as number ?? 18,
  }
}

export async function fetchBRC20Info(): Promise<Map<string, UnisatTokenInfo>> {
  const results = await Promise.allSettled(
    BRC20_TICKERS.map((t) => fetchTickerInfo(t))
  )

  const map = new Map<string, UnisatTokenInfo>()
  results.forEach((r) => {
    if (r.status === 'fulfilled' && r.value) {
      map.set(r.value.ticker.toUpperCase(), r.value)
    }
  })
  return map
}
