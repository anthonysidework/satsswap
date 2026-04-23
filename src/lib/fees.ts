import type { AssetType } from '@/types'

interface MempoolFees {
  fastestFee: number
  halfHourFee: number
  hourFee: number
  economyFee: number
  minimumFee: number
}

export interface NetworkFees {
  fastSatPerVb: number
  mediumSatPerVb: number
  slowSatPerVb: number
}

// Estimated virtual bytes per swap type
// Rune: 1 input + 2 outputs (rune transfer + change) + OP_RETURN runestone ≈ 300 vB
// BRC-20: commit + reveal inscriptions ≈ 450 vB
// BTC: standard P2WPKH → P2WPKH ≈ 140 vB
const VBYTES: Record<AssetType, number> = {
  RUNE: 300,
  BRC20: 450,
  BTC: 140,
  ORDINAL: 400,
}

let cache: { fees: NetworkFees; fetchedAt: number } | null = null
const CACHE_TTL = 60_000 // 1 minute

export async function getNetworkFees(): Promise<NetworkFees> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.fees

  try {
    const res = await fetch('https://mempool.space/api/v1/fees/recommended', {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error(`mempool fees: ${res.status}`)
    const data: MempoolFees = await res.json()
    const fees: NetworkFees = {
      fastSatPerVb: data.fastestFee,
      mediumSatPerVb: data.halfHourFee,
      slowSatPerVb: data.hourFee,
    }
    cache = { fees, fetchedAt: Date.now() }
    return fees
  } catch {
    // Conservative fallback if mempool.space is unavailable
    return { fastSatPerVb: 10, mediumSatPerVb: 5, slowSatPerVb: 2 }
  }
}

export function estimateSwapFee(assetType: AssetType, satPerVb: number): number {
  return Math.ceil(VBYTES[assetType] * satPerVb)
}
