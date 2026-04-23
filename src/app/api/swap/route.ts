import { NextRequest, NextResponse } from 'next/server'
import { getLiveTokenList } from '@/lib/prices'

export const dynamic = 'force-dynamic'

/**
 * POST /api/swap
 *
 * Receives a confirmed quote and wallet info, calls the winning DEX adapter's
 * buildSwapTx() to get a PSBT, then returns it to the client for signing.
 *
 * The client signs the PSBT in the wallet, then broadcasts via mempool.space.
 * This route never touches private keys — it only constructs unsigned transactions.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromTokenId, toTokenId, fromAmount, dex, walletAddress, publicKey, slippageBps } = body

    if (!fromTokenId || !toTokenId || !fromAmount || !dex || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tokens = await getLiveTokenList()
    const fromToken = tokens.find((t) => t.id === fromTokenId)
    const toToken = tokens.find((t) => t.id === toTokenId)

    if (!fromToken || !toToken) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Route to the correct DEX adapter
    // Real adapters (OKX, etc.) will be added here as they are integrated.
    // Mock adapters return isLive: false — the client should show a "not yet live" state
    // rather than attempting to sign.
    const LIVE_DEXES: string[] = [] // populate as real adapters are wired

    if (!LIVE_DEXES.includes(dex)) {
      return NextResponse.json({
        error: 'DEX not yet integrated',
        dex,
        isLive: false,
        message: `${dex} is not yet connected to SatsSwap. Real swaps coming soon.`,
      }, { status: 422 })
    }

    // Placeholder for real DEX adapter dispatch:
    // const adapter = getDexAdapter(dex)
    // const tx = await adapter.buildSwapTx({ fromToken, toToken, fromAmount, walletAddress, publicKey, slippageBps })
    // return NextResponse.json({ psbtHex: tx.psbtHex, fee: tx.fee, dex })

    return NextResponse.json({ error: 'DEX not implemented' }, { status: 501 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
