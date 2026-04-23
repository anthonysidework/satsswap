import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_LIST } from '@/lib/constants'
import type { AssetType } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as AssetType | null
  const query = searchParams.get('q')?.toLowerCase()

  let tokens = TOKEN_LIST

  if (type) tokens = tokens.filter((t) => t.type === type)
  if (query) tokens = tokens.filter((t) => t.symbol.toLowerCase().includes(query) || t.name.toLowerCase().includes(query))

  return NextResponse.json(tokens)
}
