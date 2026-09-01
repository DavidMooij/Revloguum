import { useState, useCallback } from "react";
import { recalculateVehicleOdometer } from "../utils/updateVehicleOdometer";
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
import { syncNotifications } from "@/notifications/syncNotifications";

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
  }, [
    filter.vehicleId,
    filter.dateFrom,
    filter.dateTo,
    filter.searchText,
    filter.notesOnly,
    filter.limit,
    filter.offset,
  ]);


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

      await recalculateVehicleOdometer(db, input.vehicleId);

      await load();
      void syncNotifications().catch(() => {});
    },
    [load],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const db = await getDatabase();
      const fuelRepo = new SQLiteFuelRepo(db);
      const existingEntry = await fuelRepo.getById(id);
      await fuelRepo.delete(id);
      if (existingEntry) {
        await recalculateVehicleOdometer(db, existingEntry.vehicleId);
      }
      await load();
      void syncNotifications().catch(() => {});
    },
    [load],
  );

  const updateEntry = useCallback(
    async (id: string, input: UpdateFuelEntryInput) => {
      const db = await getDatabase();
      const fuelRepo = new SQLiteFuelRepo(db);

      const existingEntry = await fuelRepo.getById(id);

      await fuelRepo.update(id, input);

      if (existingEntry) {
        await recalculateVehicleOdometer(db, existingEntry.vehicleId);
      }

      await load();
      void syncNotifications().catch(() => {});
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
