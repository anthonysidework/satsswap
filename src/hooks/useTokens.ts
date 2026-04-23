'use client'
import { useState, useEffect } from 'react'
import { TOKEN_LIST } from '@/lib/constants'
import type { Token } from '@/types'

interface UseTokensResult {
  tokens: Token[]
  isLive: boolean
  loading: boolean
}

// Client-side hook — initializes with mock data instantly, then silently updates with live prices
export function useTokens(): UseTokensResult {
  const [tokens, setTokens] = useState<Token[]>(TOKEN_LIST)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/tokens')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((data: Token[]) => {
        if (!cancelled) {
          setTokens(data)
          setIsLive(true)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
        // Keep mock data on error — no visible failure to user
      })
    return () => { cancelled = true }
  }, [])

  return { tokens, isLive, loading }
}
