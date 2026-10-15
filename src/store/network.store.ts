import { create } from 'zustand'

interface NetworkState {
  isServerDown: boolean
  setServerDown: (down: boolean) => void
}

export const useNetworkStore = create<NetworkState>()((set) => ({
  isServerDown: false,
  setServerDown: (down) => set({ isServerDown: down }),
}))
