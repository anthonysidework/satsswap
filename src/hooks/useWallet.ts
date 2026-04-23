'use client'
import { useWalletStore } from '@/store/wallet'
import type { ConnectedWallet } from '@/types'
import {
  getAddress,
  signTransaction,
  AddressPurpose,
  BitcoinNetworkType,
} from 'sats-connect'

declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>
      getPublicKey: () => Promise<string>
      getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>
      signPsbt: (psbtHex: string, opts?: { autoFinalized?: boolean; toSignInputs?: { index: number; address: string }[] }) => Promise<string>
    }
    okxwallet?: {
      bitcoin?: {
        requestAccounts: () => Promise<string[]>
        getPublicKey: () => Promise<string>
        getBalance: () => Promise<{ total: number; confirmed: number; unconfirmed: number }>
        signPsbt: (psbtHex: string, opts?: { autoFinalized?: boolean; toSignInputs?: { index: number; address: string }[] }) => Promise<string>
      }
    }
    LeatherProvider?: {
      request: (method: string, params?: unknown) => Promise<{
        result?: {
          addresses?: Array<{ address: string; publicKey?: string; type?: string }>
        }
        id?: string
        jsonrpc?: string
      }>
    }
  }
}

async function fetchBalance(address: string): Promise<number> {
  try {
    const res = await fetch(`/api/balance?address=${encodeURIComponent(address)}`)
    if (!res.ok) return 0
    const data = await res.json()
    return data.balanceSats ?? 0
  } catch {
    return 0
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
    connect({
      address: accounts[0],
      publicKey,
      provider: 'unisat',
      balanceSats: balance.total,
    })
  }

  async function connectXverse(): Promise<void> {
    return new Promise((resolve, reject) => {
      getAddress({
        payload: {
          purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
          message: 'Connect wallet to SatsSwap',
          network: { type: BitcoinNetworkType.Mainnet },
        },
        onFinish: async (response) => {
          const payment = response.addresses.find((a) => a.purpose === AddressPurpose.Payment)
          const ordinals = response.addresses.find((a) => a.purpose === AddressPurpose.Ordinals)
          if (!payment) { reject(new Error('No payment address returned')); return }
          const balanceSats = await fetchBalance(payment.address)
          const w: ConnectedWallet = {
            address: payment.address,
            taprootAddress: ordinals?.address,
            publicKey: payment.publicKey ?? '',
            provider: 'xverse',
            balanceSats,
          }
          connect(w)
          resolve()
        },
        onCancel: () => reject(new Error('User cancelled')),
      })
    })
  }

  async function connectOKX(): Promise<void> {
    if (!window.okxwallet?.bitcoin) {
      window.open('https://www.okx.com/web3', '_blank')
      return
    }
    const accounts = await window.okxwallet.bitcoin.requestAccounts()
    const publicKey = await window.okxwallet.bitcoin.getPublicKey()
    const balance = await window.okxwallet.bitcoin.getBalance()
    connect({
      address: accounts[0],
      publicKey,
      provider: 'okx',
      balanceSats: balance.total ?? 0,
    })
  }

  async function connectLeather(): Promise<void> {
    if (!window.LeatherProvider) {
      window.open('https://leather.io/install-extension', '_blank')
      return
    }
    const res = await window.LeatherProvider.request('getAddresses')
    const addresses = res?.result?.addresses ?? []
    const segwit = addresses.find((a) => a.type === 'p2wpkh' || a.address?.startsWith('bc1q'))
    const taproot = addresses.find((a) => a.type === 'p2tr' || a.address?.startsWith('bc1p'))
    const primary = segwit ?? taproot ?? addresses[0]
    if (!primary?.address) throw new Error('No address returned from Leather')
    const balanceSats = await fetchBalance(primary.address)
    connect({
      address: primary.address,
      taprootAddress: taproot?.address,
      publicKey: primary.publicKey ?? '',
      provider: 'leather',
      balanceSats,
    })
  }

  async function connectWallet(providerId: string): Promise<void> {
    try {
      switch (providerId) {
        case 'unisat':  await connectUnisat();  break
        case 'xverse':  await connectXverse();  break
        case 'okx':     await connectOKX();     break
        case 'leather': await connectLeather(); break
      }
    } catch (err) {
      console.error('Wallet connection failed:', err)
      throw err
    }
  }

  // Normalized signPsbt — routes to the correct provider's signing API
  async function signPsbt(psbtHex: string): Promise<string> {
    if (!wallet) throw new Error('Wallet not connected')

    switch (wallet.provider) {
      case 'unisat': {
        if (!window.unisat) throw new Error('Unisat not found')
        return window.unisat.signPsbt(psbtHex, {
          autoFinalized: true,
          toSignInputs: [{ index: 0, address: wallet.address }],
        })
      }
      case 'okx': {
        if (!window.okxwallet?.bitcoin) throw new Error('OKX wallet not found')
        return window.okxwallet.bitcoin.signPsbt(psbtHex, {
          autoFinalized: true,
          toSignInputs: [{ index: 0, address: wallet.address }],
        })
      }
      case 'xverse': {
        return new Promise((resolve, reject) => {
          // Convert hex to base64 for sats-connect
          const bytes = Buffer.from(psbtHex, 'hex')
          const psbtBase64 = bytes.toString('base64')
          signTransaction({
            payload: {
              network: { type: BitcoinNetworkType.Mainnet },
              message: 'Sign swap transaction',
              psbtBase64,
              broadcast: false,
              inputsToSign: [{ address: wallet.address, signingIndexes: [0] }],
            },
            onFinish: (response) => {
              resolve(Buffer.from(response.psbtBase64, 'base64').toString('hex'))
            },
            onCancel: () => reject(new Error('User cancelled signing')),
          })
        })
      }
      case 'leather': {
        if (!window.LeatherProvider) throw new Error('Leather not found')
        const res = await window.LeatherProvider.request('signPsbt', {
          hex: psbtHex,
          network: 'mainnet',
          broadcast: false,
        })
        const signed = (res as { result?: { hex?: string } })?.result?.hex
        if (!signed) throw new Error('Leather did not return signed PSBT')
        return signed
      }
      default:
        throw new Error(`signPsbt not implemented for provider: ${wallet.provider}`)
    }
  }

  return { wallet, isConnecting, isModalOpen, connectWallet, disconnect, openModal, closeModal, signPsbt }
}
