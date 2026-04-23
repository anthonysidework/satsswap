'use client'
import { useState, useCallback } from 'react'
import type { Token, AggregatedQuote } from '@/types'
import { debounce } from '@/lib/utils'

interface SwapState {
  fromToken: Token | null
  toToken: Token | null
  fromAmount: string
  slippage: number
  quote: AggregatedQuote | null
  isQuoting: boolean
  isSwapping: boolean
  error: string | null
  txHash: string | null
}

export function useSwap() {
  const [state, setState] = useState<SwapState>({
    fromToken: null,
    toToken: null,
    fromAmount: '',
    slippage: 1,
    quote: null,
    isQuoting: false,
    isSwapping: false,
    error: null,
    txHash: null,
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
      const next = { ...s, fromToken: token, quote: null }
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
      const next = { ...s, fromAmount: amount, quote: null }
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
    }))
  }

  function setSlippage(slippage: number) {
    setState((s) => ({ ...s, slippage }))
  }

  async function executeSwap() {
    if (!state.quote) return
    setState((s) => ({ ...s, isSwapping: true, error: null }))
    await new Promise((r) => setTimeout(r, 2500))
    const fakeTxHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    setState((s) => ({ ...s, isSwapping: false, txHash: fakeTxHash }))
  }

  function resetSwap() {
    setState((s) => ({ ...s, txHash: null, quote: null, fromAmount: '' }))
  }

  return { ...state, setFromToken, setToToken, setFromAmount, flipTokens, setSlippage, executeSwap, resetSwap }
}
