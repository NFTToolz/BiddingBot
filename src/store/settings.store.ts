import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Settings {
  apiKey: string;
  rateLimit: number;
}

interface SettingsState {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  updateApiKey: (apiKey: string) => void;
  updateRateLimit: (rateLimit: number) => void;
  clearSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        apiKey: "",
        rateLimit: 0,
      },
      setSettings: (settings) => set({ settings }),
      updateApiKey: (apiKey) =>
        set((state) => ({
          settings: { ...state.settings, apiKey },
        })),
      updateRateLimit: (rateLimit) =>
        set((state) => ({
          settings: { ...state.settings, rateLimit },
        })),
      clearSettings: () =>
        set({
          settings: {
            apiKey: "",
            rateLimit: 0,
          },
        }),
    }),
    {
      name: "settings",
    }
  )
);
