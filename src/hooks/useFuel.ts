import { useState, useCallback } from "react";
import { updateVehicleOdometerIfHigher } from "../utils/updateVehicleOdometer";
import { useFocusEffect } from "@react-navigation/native";
import { getDatabase } from "../data/db/database";
import { SQLiteFuelRepo } from "../data/repositories/SQLiteFuelRepo";
import type {
  FuelEntry,
  CreateFuelEntryInput,
  UpdateFuelEntryInput,
  FuelFilter,
  FuelStats,
} from "../domain/entities/FuelEntry";

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
      await fuelRepo.insert(input);

      await updateVehicleOdometerIfHigher(
        db,
        input.vehicleId,
        input.odometerKm,
      );

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

  const updateEntry = useCallback(
    async (id: string, input: UpdateFuelEntryInput) => {
      const db = await getDatabase();
      const fuelRepo = new SQLiteFuelRepo(db);

      const existingEntry = await fuelRepo.getById(id);

      await fuelRepo.update(id, input);

      if (existingEntry && input.odometerKm !== undefined) {
        await updateVehicleOdometerIfHigher(
          db,
          existingEntry.vehicleId,
          input.odometerKm,
        );
      }

      await load();
    },
    [load],
  );

  return {
    entries,
    stats,
    loading,
    refresh: load,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
