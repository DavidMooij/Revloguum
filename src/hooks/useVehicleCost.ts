import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../data/db/database';
import {
  SQLiteVehicleCostRepo,
  type UpsertPaymentIntervalInput,
} from '../data/repositories/SQLiteVehicleCostRepo';
import type { VehicleCost, CreateVehicleCostInput } from '../domain/entities/VehicleCost';
import { syncNotifications } from '@/notifications/syncNotifications';

export function useVehicleCosts(vehicleId: string) {
  const [costs, setCosts] = useState<VehicleCost[]>([]);
  const [intervals, setIntervals] = useState<VehicleCost[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const repo = new SQLiteVehicleCostRepo(db);
      const [history, intervalRows, total] = await Promise.all([
        repo.getHistory(vehicleId),
        repo.getIntervals(vehicleId),
        repo.getTotalCost(vehicleId),
      ]);
      setCosts(history);
      setIntervals(intervalRows);
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
    await syncNotifications();
  }, [load]);

  const updateCost = useCallback(async (id: string, input: Partial<CreateVehicleCostInput>) => {
    const db = await getDatabase();
    await new SQLiteVehicleCostRepo(db).update(id, input);
    await load();
    await syncNotifications();
  }, [load]);

  const deleteCost = useCallback(async (id: string) => {
    const db = await getDatabase();
    await new SQLiteVehicleCostRepo(db).delete(id);
    await load();
    await syncNotifications();
  }, [load]);

  const replaceIntervals = useCallback(async (next: UpsertPaymentIntervalInput[]) => {
    const db = await getDatabase();
    await new SQLiteVehicleCostRepo(db).replaceIntervals(vehicleId, next);
    await load();
    await syncNotifications();
  }, [vehicleId, load]);

  return {
    costs,
    intervals,
    totalCost,
    loading,
    refresh: load,
    addCost,
    updateCost,
    deleteCost,
    replaceIntervals,
  };
}