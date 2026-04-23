import { NextRequest, NextResponse } from 'next/server'
import { getLiveTokenList } from '@/lib/prices'

const UNISAT_BASE = 'https://open-api.unisat.io'

// Fetch balance for one specific BRC-20 ticker at a given address.
// Returns the already-human-readable balance (e.g. "9224378.22" for ORDI).
// Endpoint confirmed: GET /v1/indexer/address/{address}/brc20/{ticker}/info
async function fetchTickerBalance(
  address: string,
  ticker: string,
  key: string
): Promise<number> {
  const res = await fetch(
    `${UNISAT_BASE}/v1/indexer/address/${address}/brc20/${ticker}/info`,
    { headers: { Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
  )
  if (!res.ok) return 0
  const json = await res.json()
  if (json?.code !== 0 || !json?.data) return 0
  return parseFloat(json.data.overallBalance ?? '0') || 0
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const address = new URL(req.url).searchParams.get('address')
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 })
  }

  const key = process.env.UNISAT_API_KEY
  if (!key) {
    return NextResponse.json({ holdings: [], runesSupported: false })
  }

  const [tokens] = await Promise.all([getLiveTokenList()])

  const brc20Tokens = tokens.filter((t) => t.type === 'BRC20')

  // Fetch balances for all tracked BRC-20 tokens in parallel
  const balanceResults = await Promise.allSettled(
    brc20Tokens.map(async (token) => {
      const balance = await fetchTickerBalance(address, token.symbol.toLowerCase(), key)
      return { token, balance }
    })
  )

  const holdings = balanceResults
    .filter(
      (r): r is PromiseFulfilledResult<{ token: typeof brc20Tokens[0]; balance: number }> =>
        r.status === 'fulfilled' && r.value.balance > 0
    )
    .map(({ value: { token, balance } }) => ({
      tokenId: token.id,
      symbol: token.symbol,
      type: 'BRC20' as const,
      balance,
      valueUSD: balance * token.priceUSD,
      valueBTC: balance * token.priceBTC,
      change24h: token.change24h,
      logoColor: token.logoColor,
      logoUrl: token.logoUrl,
    }))

  return NextResponse.json({ holdings, runesSupported: false })
}
