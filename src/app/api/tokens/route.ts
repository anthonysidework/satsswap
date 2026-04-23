import { NextRequest, NextResponse } from 'next/server'
import { getLiveTokenList } from '@/lib/prices'
import type { AssetType } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as AssetType | null
  const query = searchParams.get('q')?.toLowerCase()

  let tokens = await getLiveTokenList()
  if (type) tokens = tokens.filter((t) => t.type === type)
  if (query) {
    tokens = tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query)
    )
  }

  return NextResponse.json(tokens, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
