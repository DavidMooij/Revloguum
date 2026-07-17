import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../data/db/database';
import { SQLiteServiceEntryRepo } from '../data/repositories/SQLiteServiceEntryRepo';

export interface VehicleStats {
  totalServices: number;
  totalCost: number;
  lastServiceTs: number | null;
  lastOdometer: number | null;
}

export function useVehicleStats(vehicleId: string | null) {
  const [stats, setStats] = useState<VehicleStats>({
    totalServices: 0,
    totalCost: 0,
    lastServiceTs: null,
    lastOdometer: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const [count, cost, last] = await Promise.all([
        repo.getCountForVehicle(vehicleId),
        repo.getTotalCostForVehicle(vehicleId),
        repo.getLastForVehicle(vehicleId),
      ]);
      setStats({
        totalServices: count,
        totalCost: cost,
        lastServiceTs: last?.dateTs ?? null,
        lastOdometer: last?.odometerKm ?? null,
      });
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { stats, loading, refresh: load };
}
