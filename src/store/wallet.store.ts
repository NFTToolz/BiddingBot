import { create } from "zustand";

export interface Wallet {
  _id: string;
  name: string;
  address: string;
  privateKey: string;
  openseaApproval: boolean;
  magicedenApproval: boolean;
  blurApproval: boolean;
}

interface WalletState {
  wallets: Wallet[];
  setWallets: (wallets: Wallet[]) => void; // New method to set wallets
  addWallet: (wallet: Omit<Wallet, "id">) => void;
  editWallet: (id: string, name: string) => void;
  deleteWallet: (id: string) => void;
  clearWallets: () => void;
  getWallet: (id: string) => Wallet | undefined;
}

export const useWalletStore = create<WalletState>()(
  // Remove the persist middleware
  (set, get) => ({
    wallets: [],
    setWallets: (wallets) => set({ wallets }), // Set wallets in state
    addWallet: (wallet) =>
      set((state) => ({
        wallets: [
          ...state.wallets,
          {
            ...wallet,
          },
        ],
      })),
    editWallet: (id, name) =>
      set((state) => ({
        wallets: state.wallets.map((wallet) =>
          wallet._id === id ? { ...wallet, name } : wallet
        ),
      })),
    deleteWallet: (id) =>
      set((state) => ({
        wallets: state.wallets.filter((wallet) => wallet._id !== id),
      })),
    clearWallets: () => set({ wallets: [] }),
    getWallet: (id) => get().wallets.find((wallet) => wallet._id === id),
  })
);
