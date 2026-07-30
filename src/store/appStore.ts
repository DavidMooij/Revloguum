import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Vehicle } from '../domain/entities/Vehicle';

const READABILITY_MODE_KEY = 'revlog.readabilityMode';

interface AppState {
  isDbReady: boolean;
  arePrefsReady: boolean;
  activeVehicleId: string | null;
  vehicles: Vehicle[];
  readabilityMode: boolean;

  setDbReady: (ready: boolean) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setActiveVehicleId: (id: string | null) => void;
  setReadabilityMode: (enabled: boolean) => Promise<void>;
  hydratePreferences: () => Promise<void>;
  getActiveVehicle: () => Vehicle | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  isDbReady: false,
  arePrefsReady: false,
  activeVehicleId: null,
  vehicles: [],
  readabilityMode: false,

  setDbReady: (ready) => set({ isDbReady: ready }),

  setVehicles: (vehicles) => {
    const current = get().activeVehicleId;
    const stillExists = vehicles.some(b => b.id === current);
    set({
      vehicles: vehicles,
      activeVehicleId: stillExists
        ? current
        : vehicles.length > 0
          ? vehicles[0].id
          : null,
    });
  },

  setActiveVehicleId: (id) => set({ activeVehicleId: id }),

  setReadabilityMode: async (enabled) => {
    set({ readabilityMode: enabled });
    try {
      await SecureStore.setItemAsync(
        READABILITY_MODE_KEY,
        enabled ? '1' : '0',
      );
    } catch {}
  },

  hydratePreferences: async () => {
    try {
      const stored = await SecureStore.getItemAsync(READABILITY_MODE_KEY);
      set({ readabilityMode: stored === '1', arePrefsReady: true });
    } catch {
      set({ arePrefsReady: true });
    }
  },

  getActiveVehicle: () => {
    const { vehicles, activeVehicleId } = get();
    return vehicles.find(b => b.id === activeVehicleId) ?? null;
  },
}));
