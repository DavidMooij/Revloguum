import { useState, useCallback, useEffect, useRef } from "react";
import { getDatabase } from "../data/db/database";
import { SQLiteServiceEntryRepo } from "../data/repositories/SQLiteServiceEntryRepo";
import type {
  ServiceEntryWithDetails,
  ServiceEntryFilter,
  CreateServiceEntryInput,
  UpdateServiceEntryInput,
} from "../domain/entities/ServiceEntry";

const PAGE_SIZE = 50;

export function useServiceHistory(filter: ServiceEntryFilter) {
  const [entries, setEntries] = useState<ServiceEntryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const offsetRef = useRef(0);

  const load = useCallback(
    async (reset: boolean) => {
      if (reset) {
        setLoading(true);
        offsetRef.current = 0;
      } else {
        setLoadingMore(true);
      }
      try {
        const db = await getDatabase();
        const repo = new SQLiteServiceEntryRepo(db);
        const rows = await repo.fetchFiltered({
          ...filter,
          limit: PAGE_SIZE,
          offset: offsetRef.current,
        });
        if (reset) {
          setEntries(rows);
        } else {
          setEntries((prev) => [...prev, ...rows]);
        }
        setHasMore(rows.length === PAGE_SIZE);
        offsetRef.current += rows.length;
        setError(null);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      filter.vehicleId,
      filter.dateFrom,
      filter.dateTo,
      filter.searchText,
      filter.serviceTypeIds,
    ],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) load(false);
  }, [load, loadingMore, hasMore]);

  const refresh = useCallback(() => load(true), [load]);

  return { entries, loading, loadingMore, hasMore, error, refresh, loadMore };
}

export function useServiceEntryActions() {
  const addEntry = useCallback(async (input: CreateServiceEntryInput) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceEntryRepo(db);
    return repo.insert(input);
  }, []);

  const updateEntry = useCallback(
    async (id: string, input: UpdateServiceEntryInput) => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      return repo.update(id, input);
    },
    [],
  );

  const deleteEntry = useCallback(async (id: string) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceEntryRepo(db);
    return repo.delete(id);
  }, []);

  const getLastForVehicle = useCallback(async (vehicleId: string) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceEntryRepo(db);
    return repo.getLastForVehicle(vehicleId);
  }, []);

  return { addEntry, updateEntry, deleteEntry, getLastForVehicle };
}
