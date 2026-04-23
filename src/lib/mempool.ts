const MEMPOOL = 'https://mempool.space/api'

export type TxStatus = 'broadcasting' | 'mempool' | 'confirmed' | 'failed'

export interface TxState {
  txid: string
  status: TxStatus
  blockHeight?: number
  blockTime?: number
}

/** Broadcast a signed raw transaction or signed PSBT hex. Returns txid. */
export async function broadcastTx(txHex: string): Promise<string> {
  const res = await fetch(`${MEMPOOL}/tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: txHex,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(`Broadcast failed: ${msg}`)
  }
  return res.text() // mempool.space returns just the txid as plain text
}

/** Fetch current status of a transaction from mempool.space. */
export async function getTxStatus(txid: string): Promise<TxState> {
  const res = await fetch(`${MEMPOOL}/tx/${txid}`)
  if (res.status === 404) return { txid, status: 'mempool' }
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`)

  const data = await res.json()
  const confirmed = data?.status?.confirmed === true

  return {
    txid,
    status: confirmed ? 'confirmed' : 'mempool',
    blockHeight: data?.status?.block_height,
    blockTime: data?.status?.block_time,
  }
}

/**
 * Poll transaction status every `intervalMs` ms until confirmed or max attempts.
 * Calls `onUpdate` with each status change.
 */
export function pollTxStatus(
  txid: string,
  onUpdate: (state: TxState) => void,
  intervalMs = 15_000,
  maxAttempts = 40
): () => void {
  let attempts = 0
  let stopped = false

  async function check() {
    if (stopped) return
    try {
      const state = await getTxStatus(txid)
      onUpdate(state)
      if (state.status === 'confirmed' || attempts >= maxAttempts) return
    } catch {
      // Network blip — keep polling
    }
    attempts++
    if (!stopped) setTimeout(check, intervalMs)
  }

  setTimeout(check, intervalMs) // first check after one interval
  return () => { stopped = true }
}
