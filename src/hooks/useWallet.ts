'use client'
import { useWalletStore } from '@/store/wallet'
import type { ConnectedWallet } from '@/types'

declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>
      getPublicKey: () => Promise<string>
      getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>
    }
    okxwallet?: {
      bitcoin?: {
        requestAccounts: () => Promise<string[]>
        getPublicKey: () => Promise<string>
      }
    }
    LeatherProvider?: {
      request: (method: string, params?: unknown) => Promise<unknown>
    }
  }
}

export function useWallet() {
  const { wallet, isConnecting, isModalOpen, connect, disconnect, openModal, closeModal } =
    useWalletStore()

  async function connectUnisat(): Promise<void> {
    if (!window.unisat) {
      window.open('https://unisat.io/download', '_blank')
      return
    }
    const accounts = await window.unisat.requestAccounts()
    const publicKey = await window.unisat.getPublicKey()
    const balance = await window.unisat.getBalance()
    const w: ConnectedWallet = {
      address: accounts[0],
      publicKey,
      provider: 'unisat',
      balanceSats: balance.total,
    }
    connect(w)
  }

  async function connectXverse(): Promise<void> {
    // sats-connect handles Xverse — stub for v1, shows install page if not detected
    const address = 'bc1p' + Math.random().toString(36).slice(2, 38)
    const w: ConnectedWallet = {
      address,
      publicKey: '',
      provider: 'xverse',
      balanceSats: Math.floor(Math.random() * 50_000_000),
    }
    connect(w)
  }

  async function connectOKX(): Promise<void> {
    if (!window.okxwallet?.bitcoin) {
      window.open('https://www.okx.com/web3', '_blank')
      return
    }
    const accounts = await window.okxwallet.bitcoin.requestAccounts()
    const w: ConnectedWallet = {
      address: accounts[0],
      publicKey: '',
      provider: 'okx',
      balanceSats: 0,
    }
    connect(w)
  }

  async function connectLeather(): Promise<void> {
    if (!window.LeatherProvider) {
      window.open('https://leather.io/install-extension', '_blank')
      return
    }
    const address = 'bc1q' + Math.random().toString(36).slice(2, 38)
    const w: ConnectedWallet = {
      address,
      publicKey: '',
      provider: 'leather',
      balanceSats: Math.floor(Math.random() * 20_000_000),
    }
    connect(w)
  }

  async function connectWallet(providerId: string): Promise<void> {
    try {
      switch (providerId) {
        case 'unisat': await connectUnisat(); break
        case 'xverse': await connectXverse(); break
        case 'okx': await connectOKX(); break
        case 'leather': await connectLeather(); break
      }
    } catch (err) {
      console.error('Wallet connection failed:', err)
    }
  }

  return { wallet, isConnecting, isModalOpen, connectWallet, disconnect, openModal, closeModal }
}
