import { NextRequest, NextResponse } from 'next/server'

// Unified map: our token IDs/symbols → CoinGecko coin IDs
const CG_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ORDI: 'ordinals',
  SATS: 'sats-ordinals',
  RATS: '1000rats',
  'DOG•GO•TO•THE•MOON': 'dog-go-to-the-moon-runes',
  'SATOSHI•NAKAMOTO': 'satoshi-nakamoto-rune',
  'RSIC•GENESIS•RUNE': 'runecoin',
  'UNCOMMON•GOODS': 'uncommon-goods',
  'MAGIC•INTERNET•MONEY': 'magic-internet-money-runes',
}

interface PricePoint {
  time: number  // unix seconds — lightweight-charts format
  value: number
}

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const tokenId = decodeURIComponent(params.tokenId)
  const days = new URL(req.url).searchParams.get('days') ?? '7'

  const cgId = CG_ID[tokenId] ?? CG_ID[tokenId.toUpperCase()]
  if (!cgId) {
    return NextResponse.json({ prices: [] }, { status: 404 })
  }

  const url = `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=${days}`
  const res = await fetch(url, {
    next: { revalidate: days === '1' ? 180 : days === '7' ? 600 : 3600 },
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    return NextResponse.json({ prices: [] })
  }

  const raw: { prices: [number, number][] } = await res.json()

  // Convert ms timestamps to seconds, deduplicate, sort
  const seen = new Set<number>()
  const prices: PricePoint[] = (raw.prices ?? [])
    .map(([ms, value]) => ({ time: Math.floor(ms / 1000), value }))
    .filter(({ time }) => {
      if (seen.has(time)) return false
      seen.add(time)
      return true
    })
    .sort((a, b) => a.time - b.time)

  return NextResponse.json({ prices }, {
    headers: {
      'Cache-Control': `public, s-maxage=${days === '1' ? 180 : 600}, stale-while-revalidate=3600`,
    },
  })
}
