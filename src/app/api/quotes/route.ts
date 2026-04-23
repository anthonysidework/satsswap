import { NextRequest, NextResponse } from 'next/server'
import { getAggregatedQuote } from '@/lib/aggregator'
import { getLiveTokenList } from '@/lib/prices'
import { getNetworkFees, estimateSwapFee } from '@/lib/fees'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromTokenId, toTokenId, fromAmount, slippageBps } = body

    if (!fromTokenId || !toTokenId || !fromAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const [tokens, fees] = await Promise.all([getLiveTokenList(), getNetworkFees()])

    const fromToken = tokens.find((t) => t.id === fromTokenId)
    const toToken = tokens.find((t) => t.id === toTokenId)

    if (!fromToken || !toToken) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Use medium (half-hour) fee rate for swap estimates
    const networkFeeSats = estimateSwapFee(fromToken.type, fees.mediumSatPerVb)

    const quote = await getAggregatedQuote({
      fromToken,
      toToken,
      fromAmount: parseFloat(fromAmount),
      slippageBps: slippageBps ?? 100,
      networkFeeSats,
    })

    return NextResponse.json(quote)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
