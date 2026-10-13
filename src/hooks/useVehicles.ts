import { useCallback, useEffect } from 'react';
import { getDatabase } from '../data/db/database';
import { SQLiteVehicleRepo } from '../data/repositories/SQLiteVehicleRepo';
import { useAppStore } from '../store/appStore';
import type { CreateVehicleInput, UpdateVehicleInput } from '../domain/entities/Vehicle';
import { syncNotifications } from '@/notifications/syncNotifications';
import { recalculateVehicleOdometer } from '../utils/updateVehicleOdometer';
import { SQLiteDocumentRepo } from '../data/repositories/SQLiteDocumentRepo';
import { deleteEncryptedImage } from '../security/imageEncryption';
import { SQLiteServiceEntryRepo } from '../data/repositories/SQLiteServiceEntryRepo';
import { SQLiteVehicleCostRepo } from '../data/repositories/SQLiteVehicleCostRepo';

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

  const addVehicle = useCallback(
    async (input: CreateVehicleInput) => {
      const db = await getDatabase();
      const repo = new SQLiteVehicleRepo(db);
      const moto = await repo.insert(input);
      await refresh();
      setActiveVehicleId(moto.id);
      await syncNotifications();
      return moto;
    },
    [refresh, setActiveVehicleId]
  );

  const updateVehicle = useCallback(
    async (id: string, input: UpdateVehicleInput) => {
      const db = await getDatabase();
      const repo = new SQLiteVehicleRepo(db);
      const existingVehicle = await repo.getById(id);
      await repo.update(id, input);
      if (input.photoPath !== undefined && existingVehicle?.photoPath && existingVehicle.photoPath !== input.photoPath) {
        await deleteEncryptedImage(existingVehicle.photoPath);
      }
      if (input.currentOdometer !== undefined || input.baseOdometer !== undefined) {
        await recalculateVehicleOdometer(db, id);
      }
      await refresh();
      await syncNotifications();
    },
    [refresh]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      const db = await getDatabase();
      const repo = new SQLiteVehicleRepo(db);
      const [vehicle, documents, serviceImagePaths, costImagePaths] = await Promise.all([
        repo.getById(id),
        new SQLiteDocumentRepo(db).getForVehicle(id),
        new SQLiteServiceEntryRepo(db).getImagePathsForVehicle(id),
        new SQLiteVehicleCostRepo(db).getImagePathsForVehicle(id)
      ]);
      await repo.delete(id);
      const imagePaths = new Set(
        [
          vehicle?.photoPath ?? null,
          ...serviceImagePaths,
          ...costImagePaths,
          ...documents.flatMap((document) => document.pages.map((page) => page.path))
        ].filter((path): path is string => !!path)
      );
      await Promise.all([...imagePaths].map(deleteEncryptedImage));
      await refresh();
      await syncNotifications();
    },
    [refresh]
  );

  return {
    vehicles,
    activeVehicle: getActiveVehicle(),
    activeVehicleId,
    setActiveVehicleId,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refresh
  };
}
