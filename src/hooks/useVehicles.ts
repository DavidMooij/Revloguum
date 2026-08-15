import { useCallback, useEffect } from 'react';
import { getDatabase } from '../data/db/database';
import { SQLiteVehicleRepo } from '../data/repositories/SQLiteVehicleRepo';
import { useAppStore } from '../store/appStore';
import type { CreateVehicleInput, UpdateVehicleInput } from '../domain/entities/Vehicle';
import { syncNotifications } from '@/notifications/syncNotifications';

export function useVehicles() {
  const { vehicles, setVehicles, activeVehicleId, setActiveVehicleId, getActiveVehicle } = useAppStore();

  const refresh = useCallback(async () => {
    const db = await getDatabase();
    const repo = new SQLiteVehicleRepo(db);
    const all = await repo.getAll();
    setVehicles(all);
  }, [setVehicles]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addVehicle = useCallback(async (input: CreateVehicleInput) => {
    const db = await getDatabase();
    const repo = new SQLiteVehicleRepo(db);
    const moto = await repo.insert(input);
    await refresh();
    setActiveVehicleId(moto.id);
    await syncNotifications();
    return moto;
  }, [refresh, setActiveVehicleId]);

  const updateVehicle = useCallback(async (id: string, input: UpdateVehicleInput) => {
    const db = await getDatabase();
    const repo = new SQLiteVehicleRepo(db);
    await repo.update(id, input);
    await refresh();
    await syncNotifications();
  }, [refresh]);

  const deleteVehicle = useCallback(async (id: string) => {
    const db = await getDatabase();
    const repo = new SQLiteVehicleRepo(db);
    await repo.delete(id);
    await refresh();
    await syncNotifications();
  }, [refresh]);

  return {
    vehicles,
    activeVehicle: getActiveVehicle(),
    activeVehicleId,
    setActiveVehicleId,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refresh,
  };
}
