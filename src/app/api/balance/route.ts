import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const address = new URL(req.url).searchParams.get('address')
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://mempool.space/api/address/${address}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) throw new Error(`mempool.space ${res.status}`)
    const data = await res.json()

    const chain = data.chain_stats ?? {}
    const mempool = data.mempool_stats ?? {}

    const confirmedSats = (chain.funded_txo_sum ?? 0) - (chain.spent_txo_sum ?? 0)
    const pendingSats = (mempool.funded_txo_sum ?? 0) - (mempool.spent_txo_sum ?? 0)

    return NextResponse.json({
      balanceSats: confirmedSats,
      pendingSats,
      totalSats: confirmedSats + pendingSats,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
