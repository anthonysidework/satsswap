'use client'
import { create } from 'zustand'
import type { ConnectedWallet } from '@/types'

interface WalletState {
  wallet: ConnectedWallet | null
  isConnecting: boolean
  isModalOpen: boolean
  connect: (wallet: ConnectedWallet) => void
  disconnect: () => void
  openModal: () => void
  closeModal: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  isConnecting: false,
  isModalOpen: false,
  connect: (wallet) => set({ wallet, isConnecting: false, isModalOpen: false }),
  disconnect: () => set({ wallet: null }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}))
