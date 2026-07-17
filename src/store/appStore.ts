import { create } from 'zustand';
import type { Vehicle } from '../domain/entities/Vehicle';

interface AppState {
  isDbReady: boolean;
  activeVehicleId: string | null;
  vehicles: Vehicle[];

  setDbReady: (ready: boolean) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setActiveVehicleId: (id: string | null) => void;
  getActiveVehicle: () => Vehicle | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  isDbReady: false,
  activeVehicleId: null,
  vehicles: [],

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

  getActiveVehicle: () => {
    const { vehicles, activeVehicleId } = get();
    return vehicles.find(b => b.id === activeVehicleId) ?? null;
  },
}));
