import { NextRequest, NextResponse } from 'next/server'
import { getLiveTokenList } from '@/lib/prices'

export const dynamic = 'force-dynamic'

const OKX_DEX_BASE = 'https://www.okx.com/api/v5/dex/aggregator'

/**
 * Build a signed OKX DEX API request.
 *
 * OKX DEX uses HMAC-SHA256 signed headers:
 *   OK-ACCESS-KEY      — API key from https://www.okx.com/web3/build/dev-portal
 *   OK-ACCESS-SIGN     — base64(HMAC-SHA256(timestamp + method + path + body, secretKey))
 *   OK-ACCESS-TIMESTAMP — ISO 8601 timestamp
 *   OK-ACCESS-PASSPHRASE — passphrase set during key creation
 *
 * Set these in .env.local:
 *   OKX_DEX_API_KEY=
 *   OKX_DEX_SECRET_KEY=
 *   OKX_DEX_PASSPHRASE=
 */
async function buildOKXHeaders(method: string, path: string, body = ''): Promise<HeadersInit> {
  const apiKey = process.env.OKX_DEX_API_KEY
  const secretKey = process.env.OKX_DEX_SECRET_KEY
  const passphrase = process.env.OKX_DEX_PASSPHRASE

  if (!apiKey || !secretKey || !passphrase) {
    throw new Error('OKX_DEX_API_KEY, OKX_DEX_SECRET_KEY, OKX_DEX_PASSPHRASE are required')
  }

  const timestamp = new Date().toISOString()
  const preSign = `${timestamp}${method.toUpperCase()}${path}${body}`

  // Use Web Crypto API (available in Next.js Edge and Node.js 18+)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(preSign))
  const sign = Buffer.from(signature).toString('base64')

  return {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': sign,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase,
  }
}

/**
 * OKX token address format for Bitcoin assets:
 * BRC-20: use the tick name (e.g. "ordi")
 * Runes: use the rune ID (e.g. "840000:3" for DOG)
 * BTC: "0x..." native Bitcoin address representation
 *
 * NOTE: Verify exact format with OKX docs when key is obtained.
 * OKX DEX Bitcoin chainId: TBD — needs verification with real key.
 */
const OKX_TOKEN_ADDRESSES: Record<string, string> = {
  BTC:  'BTC',
  ORDI: 'ordi',
  SATS: 'sats',
  MEME: 'meme',
  PEPE: 'pepe',
  'DOG•GO•TO•THE•MOON':   '840000:3',
  'SATOSHI•NAKAMOTO':      '840000:2',
  'RSIC•GENESIS•RUNE':     '1:0',
  'UNCOMMON•GOODS':        '1:0',
  'MAGIC•INTERNET•MONEY':  '840000:0',
}

async function buildOKXSwapTx(
  fromTokenId: string,
  toTokenId: string,
  fromAmount: number,
  walletAddress: string,
  slippageBps: number
): Promise<{ psbtHex: string; fee: number }> {
  const fromAddress = OKX_TOKEN_ADDRESSES[fromTokenId]
  const toAddress = OKX_TOKEN_ADDRESSES[toTokenId]

  if (!fromAddress || !toAddress) {
    throw new Error(`Token not supported on OKX DEX: ${fromTokenId} or ${toTokenId}`)
  }

  const path = `/api/v5/dex/aggregator/swap`
  const params = new URLSearchParams({
    chainId: 'BTC', // TODO: verify with OKX docs — Bitcoin chain ID in OKX DEX
    fromTokenAddress: fromAddress,
    toTokenAddress: toAddress,
    amount: Math.floor(fromAmount * 1e8).toString(), // in satoshis for BTC amounts
    slippage: (slippageBps / 10000).toString(),
    userWalletAddress: walletAddress,
  })

  const fullPath = `${path}?${params.toString()}`
  const headers = await buildOKXHeaders('GET', fullPath)

  const res = await fetch(`${OKX_DEX_BASE.replace('/api/v5/dex/aggregator', '')}${fullPath}`, { headers })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.msg ?? `OKX DEX error ${res.status}`)
  }

  const data = await res.json()
  if (data.code !== '0') throw new Error(data.msg ?? 'OKX DEX error')

  const tx = data.data?.[0]?.tx
  if (!tx) throw new Error('OKX DEX did not return transaction data')

  return { psbtHex: tx.data, fee: parseInt(tx.gas ?? '2000') }
}

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

    if (dex === 'OKX') {
      // OKX swap requires the OKX DEX API key for actual PSBT construction.
      // The quote (price data) is real from OKX exchange — execution needs the key.
      const hasOKXDEXKey = !!(process.env.OKX_DEX_API_KEY && process.env.OKX_DEX_SECRET_KEY)

      if (!hasOKXDEXKey) {
        return NextResponse.json({
          error: 'OKX DEX swap key not configured',
          isLive: false,
          message:
            'OKX price quotes are real, but swap execution requires an OKX DEX API key. ' +
            'Register at https://www.okx.com/web3/build/dev-portal and set ' +
            'OKX_DEX_API_KEY, OKX_DEX_SECRET_KEY, OKX_DEX_PASSPHRASE in your environment.',
        }, { status: 422 })
      }

      try {
        const tx = await buildOKXSwapTx(fromTokenId, toTokenId, fromAmount, walletAddress, slippageBps ?? 100)
        return NextResponse.json({ psbtHex: tx.psbtHex, fee: tx.fee, dex: 'OKX' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OKX DEX build failed'
        return NextResponse.json({ error: message, dex: 'OKX' }, { status: 500 })
      }
    }

    // All other DEXes are not yet integrated
    return NextResponse.json({
      error: 'DEX not yet integrated',
      dex,
      isLive: false,
      message: `${dex} is not yet connected to SatsSwap. Real swaps coming soon.`,
    }, { status: 422 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
