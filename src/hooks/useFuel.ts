import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getDatabase } from "../data/db/database";
import { SQLiteFuelRepo } from "../data/repositories/SQLiteFuelRepo";
import type {
  FuelEntry,
  CreateFuelEntryInput,
  FuelFilter,
  FuelStats,
} from "../domain/entities/FuelEntry";
import { SQLiteVehicleRepo } from "@/data/repositories/SQLiteVehicleRepo";

export function useFuel(filter: FuelFilter) {
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [stats, setStats] = useState<FuelStats>({
    totalLiters: 0,
    totalCost: 0,
    avgCostPerLiter: 0,
    avgConsumption: 0,
    totalEntries: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const repo = new SQLiteFuelRepo(db);
      const [rows, s] = await Promise.all([
        repo.fetchFiltered(filter),
        repo.getStats(filter),
      ]);
      setEntries(rows);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [filter.vehicleId, filter.dateFrom, filter.dateTo]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const addEntry = useCallback(
    async (input: CreateFuelEntryInput) => {
      const db = await getDatabase();

      const fuelRepo = new SQLiteFuelRepo(db);
      const vehicleRepo = new SQLiteVehicleRepo(db);

      await fuelRepo.insert(input);

      const vehicle = await vehicleRepo.getById(input.vehicleId);

      if (vehicle && input.odometerKm > vehicle.currentOdometer) {
        await vehicleRepo.update(vehicle.id, {
          currentOdometer: input.odometerKm,
        });
      }

      await load();
    },
    [load],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const db = await getDatabase();
      await new SQLiteFuelRepo(db).delete(id);
      await load();
    },
    [load],
  );

  return { entries, stats, loading, refresh: load, addEntry, deleteEntry };
}
