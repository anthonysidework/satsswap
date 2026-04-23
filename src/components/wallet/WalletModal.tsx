'use client'
import { useWallet } from '@/hooks/useWallet'
import { WALLET_PROVIDERS } from '@/lib/constants'
import { X } from 'lucide-react'
import { useState } from 'react'

export function WalletModal() {
  const { isModalOpen, closeModal, connectWallet } = useWallet()
  const [connecting, setConnecting] = useState<string | null>(null)

  if (!isModalOpen) return null

  async function handleConnect(providerId: string) {
    setConnecting(providerId)
    try {
      await connectWallet(providerId)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm shadow-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-text-primary font-bold text-lg">Connect Wallet</h2>
            <p className="text-text-secondary text-sm mt-0.5">Choose a Bitcoin wallet</p>
          </div>
          <button
            onClick={closeModal}
            className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-border"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {WALLET_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleConnect(provider.id)}
              disabled={connecting !== null}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border-light hover:bg-surface transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed text-left"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                style={{ backgroundColor: provider.iconBg }}
              >
                {connecting === provider.id ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  provider.iconText
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-text-primary font-semibold text-sm">{provider.name}</div>
                <div className="text-text-muted text-xs mt-0.5 truncate">{provider.description}</div>
              </div>
              <svg
                className="text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>

        <div className="px-6 pb-6">
          <p className="text-text-muted text-xs text-center">
            By connecting, you agree to SatsSwap&apos;s{' '}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  )
}
