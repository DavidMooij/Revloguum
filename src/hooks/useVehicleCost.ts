import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../data/db/database';
import { SQLiteVehicleCostRepo } from '../data/repositories/SQLiteVehicleCostRepo';
import type { VehicleCost, CreateVehicleCostInput } from '../domain/entities/VehicleCost';

export function useVehicleCosts(vehicleId: string) {
  const [costs, setCosts] = useState<VehicleCost[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const repo = new SQLiteVehicleCostRepo(db);
      const [all, total] = await Promise.all([
        repo.getAll(vehicleId),
        repo.getTotalCost(vehicleId),
      ]);
      setCosts(all);
      setTotalCost(total);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addCost = useCallback(async (input: CreateVehicleCostInput) => {
    const db = await getDatabase();
    await new SQLiteVehicleCostRepo(db).insert(input);
    await load();
  }, [load]);

  const updateCost = useCallback(async (id: string, input: Partial<CreateVehicleCostInput>) => {
    const db = await getDatabase();
    await new SQLiteVehicleCostRepo(db).update(id, input);
    await load();
  }, [load]);

  const deleteCost = useCallback(async (id: string) => {
    const db = await getDatabase();
    await new SQLiteVehicleCostRepo(db).delete(id);
    await load();
  }, [load]);

  return { costs, totalCost, loading, refresh: load, addCost, updateCost, deleteCost };
}