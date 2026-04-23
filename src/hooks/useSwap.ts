'use client'
import { useState, useCallback } from 'react'
import type { Token, AggregatedQuote } from '@/types'
import { debounce } from '@/lib/utils'
import { broadcastTx, pollTxStatus, type TxStatus } from '@/lib/mempool'
import { useWalletStore } from '@/store/wallet'
import { useWallet } from './useWallet'

export type SwapStep = 'idle' | 'building' | 'signing' | 'broadcasting' | 'done'

interface SwapState {
  fromToken: Token | null
  toToken: Token | null
  fromAmount: string
  slippage: number
  quote: AggregatedQuote | null
  isQuoting: boolean
  isSwapping: boolean
  swapStep: SwapStep
  txStatus: TxStatus | null
  txHash: string | null
  error: string | null
  balanceError: string | null  // pre-swap validation error shown on the button
}

export function useSwap() {
  const { wallet } = useWalletStore()
  const { signPsbt } = useWallet()

  const [state, setState] = useState<SwapState>({
    fromToken: null,
    toToken: null,
    fromAmount: '',
    slippage: 1,
    quote: null,
    isQuoting: false,
    isSwapping: false,
    swapStep: 'idle',
    txStatus: null,
    txHash: null,
    error: null,
    balanceError: null,
  })

  const fetchQuote = useCallback(
    debounce(async (fromToken: Token, toToken: Token, amount: string, slippage: number) => {
      const parsed = parseFloat(amount)
      if (!parsed || parsed <= 0) {
        setState((s) => ({ ...s, quote: null, isQuoting: false }))
        return
      }
      setState((s) => ({ ...s, isQuoting: true, error: null }))
      try {
        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromTokenId: fromToken.id,
            toTokenId: toToken.id,
            fromAmount: parsed,
            slippageBps: Math.round(slippage * 100),
          }),
        })
        if (!res.ok) throw new Error('Failed to fetch quote')
        const data: AggregatedQuote = await res.json()
        setState((s) => ({ ...s, quote: data, isQuoting: false }))
      } catch {
        setState((s) => ({ ...s, error: 'Could not fetch quote', isQuoting: false }))
      }
    }, 600),
    []
  )

  function setFromToken(token: Token) {
    setState((s) => {
      const next = { ...s, fromToken: token, quote: null, balanceError: null }
      if (next.toToken && next.fromAmount) fetchQuote(token, next.toToken, next.fromAmount, next.slippage)
      return next
    })
  }

  function setToToken(token: Token) {
    setState((s) => {
      const next = { ...s, toToken: token, quote: null }
      if (next.fromToken && next.fromAmount) fetchQuote(next.fromToken, token, next.fromAmount, next.slippage)
      return next
    })
  }

  function setFromAmount(amount: string) {
    setState((s) => {
      const balanceError = checkBalance(s.fromToken, amount, wallet?.balanceSats ?? 0)
      const next = { ...s, fromAmount: amount, quote: null, balanceError }
      if (next.fromToken && next.toToken) fetchQuote(next.fromToken, next.toToken, amount, next.slippage)
      return next
    })
  }

  function flipTokens() {
    setState((s) => ({
      ...s,
      fromToken: s.toToken,
      toToken: s.fromToken,
      fromAmount: '',
      quote: null,
      balanceError: null,
    }))
  }

  function setSlippage(slippage: number) {
    setState((s) => ({ ...s, slippage }))
  }

  async function executeSwap() {
    const { quote, fromToken } = state
    if (!quote || !fromToken || !wallet) return

    // 2C: Block if balance check failed
    if (state.balanceError) return

    // If the best quote is simulated, don't attempt a real PSBT flow
    if (!quote.bestQuote.isLive) {
      setState((s) => ({
        ...s,
        error: `${quote.bestQuote.dex} is not yet connected to SatsSwap. Real swaps coming soon.`,
      }))
      return
    }

    setState((s) => ({ ...s, isSwapping: true, swapStep: 'building', error: null }))

    try {
      // Step 1: Get PSBT from the winning DEX via our swap API
      const swapRes = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTokenId: fromToken.id,
          toTokenId: state.toToken!.id,
          fromAmount: parseFloat(state.fromAmount),
          dex: quote.bestQuote.dex,
          walletAddress: wallet.taprootAddress ?? wallet.address,
          publicKey: wallet.publicKey,
          slippageBps: Math.round(state.slippage * 100),
        }),
      })

      if (!swapRes.ok) {
        const err = await swapRes.json()
        throw new Error(err.message ?? err.error ?? 'Swap API error')
      }

      const { psbtHex } = await swapRes.json()

      // Step 2: Request user to sign in wallet
      setState((s) => ({ ...s, swapStep: 'signing' }))
      const signedPsbtHex = await signPsbt(psbtHex)

      // Step 3: Broadcast the signed transaction
      setState((s) => ({ ...s, swapStep: 'broadcasting' }))
      const txid = await broadcastTx(signedPsbtHex)

      // Step 4: Begin polling for confirmation
      setState((s) => ({ ...s, swapStep: 'done', txHash: txid, txStatus: 'mempool', isSwapping: false }))

      // Persist to localStorage for history
      saveTxHistory({
        txid,
        fromTokenId: fromToken.id,
        toTokenId: state.toToken!.id,
        fromAmount: parseFloat(state.fromAmount),
        toAmount: quote.bestQuote.estimatedOutput,
        dex: quote.bestQuote.dex,
        timestamp: Date.now(),
      })

      pollTxStatus(txid, (txState) => {
        setState((s) => ({ ...s, txStatus: txState.status }))
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed'
      setState((s) => ({ ...s, isSwapping: false, swapStep: 'idle', error: message }))
    }
  }

  function resetSwap() {
    setState((s) => ({ ...s, txHash: null, txStatus: null, quote: null, fromAmount: '', swapStep: 'idle', error: null }))
  }

  return {
    ...state,
    setFromToken, setToToken, setFromAmount, flipTokens,
    setSlippage, executeSwap, resetSwap,
  }
}

// 2C: Validate wallet has enough balance before swap
function checkBalance(fromToken: Token | null, amount: string, balanceSats: number): string | null {
  if (!fromToken || !amount) return null
  const parsed = parseFloat(amount)
  if (!parsed || parsed <= 0) return null

  if (fromToken.type === 'BTC') {
    const requiredSats = Math.ceil(parsed * 1e8)
    const feeSats = 2000 // conservative fee buffer
    if (requiredSats + feeSats > balanceSats) {
      return 'Insufficient BTC balance'
    }
  }
  // For Runes/BRC-20: we'd need the wallet's token balance, which we don't have in state.
  // Portfolio page loads it separately; skip here to avoid false negatives.
  return null
}

// Simple localStorage transaction history (max 50 entries)
interface TxRecord {
  txid: string
  fromTokenId: string
  toTokenId: string
  fromAmount: number
  toAmount: number
  dex: string
  timestamp: number
}

function saveTxHistory(tx: TxRecord) {
  try {
    const raw = localStorage.getItem('satsswap_tx_history')
    const history: TxRecord[] = raw ? JSON.parse(raw) : []
    history.unshift(tx)
    localStorage.setItem('satsswap_tx_history', JSON.stringify(history.slice(0, 50)))
  } catch {
    // localStorage unavailable (SSR or private mode)
  }
}

export function loadTxHistory(): TxRecord[] {
  try {
    const raw = localStorage.getItem('satsswap_tx_history')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
