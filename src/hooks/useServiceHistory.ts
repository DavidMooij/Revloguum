import { useState, useCallback, useEffect, useRef } from "react";
import { getDatabase } from "../data/db/database";
import { SQLiteServiceEntryRepo } from "../data/repositories/SQLiteServiceEntryRepo";
import { generateUUID } from "../utils/uuid";
import type {
  ServiceEntryWithDetails,
  ServiceEntryFilter,
  CreateServiceEntryInput,
  UpdateServiceEntryInput,
} from "../domain/entities/ServiceEntry";
import { recalculateVehicleOdometer } from "@/utils/updateVehicleOdometer";
import { syncNotifications } from "@/notifications/syncNotifications";
import { SQLiteDocumentRepo } from "../data/repositories/SQLiteDocumentRepo";
import { deleteEncryptedImage } from "../security/imageEncryption";

const PAGE_SIZE = 50;

export interface ServiceGroupItemInput {
  serviceTypeId: string;
  cost: number | null;
  notes: string | null;
}

export interface ServiceGroupCommon {
  vehicleId: string;
  dateTs: number;
  odometerKm: number;
  imagePaths: string[];
}

export interface ServiceEntryGroup {
  key: string;
  groupId: string | null;
  items: ServiceEntryWithDetails[];
  dateTs: number;
  odometerKm: number;
  totalCost: number | null;
}

export function groupServiceEntries(
  entries: ServiceEntryWithDetails[],
): ServiceEntryGroup[] {
  const groups: ServiceEntryGroup[] = [];
  const indexByGroupId = new Map<string, number>();

  for (const e of entries) {
    if (e.groupId) {
      const existing = indexByGroupId.get(e.groupId);
      if (existing != null) {
        groups[existing].items.push(e);
        continue;
      }
      indexByGroupId.set(e.groupId, groups.length);
      groups.push({
        key: e.groupId,
        groupId: e.groupId,
        items: [e],
        dateTs: e.dateTs,
        odometerKm: e.odometerKm,
        totalCost: null,
      });
    } else {
      groups.push({
        key: e.id,
        groupId: null,
        items: [e],
        dateTs: e.dateTs,
        odometerKm: e.odometerKm,
        totalCost: null,
      });
    }
  }

  for (const g of groups) {
    const costs = g.items
      .map((i) => i.cost)
      .filter((c): c is number => c != null);
    g.totalCost = costs.length ? costs.reduce((a, b) => a + b, 0) : null;
  }

  return groups;
}

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
    await repo.insert(input);
    await recalculateVehicleOdometer(db, input.vehicleId);
    await syncNotifications();
  }, []);

  const updateEntry = useCallback(
    async (id: string, input: UpdateServiceEntryInput) => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const existingEntry = await repo.getById(id);
      await repo.update(id, input);
      if (existingEntry) {
        await recalculateVehicleOdometer(db, existingEntry.vehicleId);
      }
      await syncNotifications();
    },
    [],
  );

  const deleteEntry = useCallback(async (id: string, preservedImagePaths: string[] = []) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceEntryRepo(db);
    const existingEntry = await repo.getById(id);
    const documents = await new SQLiteDocumentRepo(db).getForServiceEntry(id);
    await repo.delete(id);
    await Promise.all(
      [
        ...(existingEntry?.imagePaths ?? []),
        ...documents.flatMap((document) =>
          document.pages.map((page) => page.path),
        ),
      ]
        .filter((path) => !preservedImagePaths.includes(path))
        .map(deleteEncryptedImage),
    );
    if (existingEntry) {
      await recalculateVehicleOdometer(db, existingEntry.vehicleId);
    }
    await syncNotifications();
  }, []);

  const addGroup = useCallback(
    async (common: ServiceGroupCommon, items: ServiceGroupItemInput[]) => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const groupId = items.length > 1 ? generateUUID() : null;
      const entryIds: string[] = [];
      for (const it of items) {
        const entry = await repo.insert({
          vehicleId: common.vehicleId,
          serviceTypeId: it.serviceTypeId,
          dateTs: common.dateTs,
          odometerKm: common.odometerKm,
          cost: it.cost,
          notes: it.notes,
          imagePaths: common.imagePaths,
          groupId,
        });
        entryIds.push(entry.id);
      }

      await recalculateVehicleOdometer(db, common.vehicleId);

      await syncNotifications();

      return { groupId, entryIds };
    },
    [],
  );

  const getGroup = useCallback(async (groupId: string) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceEntryRepo(db);
    return repo.getGroup(groupId);
  }, []);

  const deleteGroup = useCallback(async (groupId: string, preservedImagePaths: string[] = []) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceEntryRepo(db);
    const group = await repo.getGroup(groupId);
    const documentRepo = new SQLiteDocumentRepo(db);
    const documents = (
      await Promise.all(
        group.map((entry) => documentRepo.getForOwner("service", entry.id)),
      )
    ).flat();
    await repo.deleteGroup(groupId);
    await Promise.all(
      [...new Set([
        ...group.flatMap((entry) => entry.imagePaths),
        ...documents.flatMap((document) =>
          document.pages.map((page) => page.path),
        ),
      ])]
        .filter((path) => !preservedImagePaths.includes(path))
        .map(deleteEncryptedImage),
    );
    if (group[0]) {
      await recalculateVehicleOdometer(db, group[0].vehicleId);
    }
    await syncNotifications();
  }, []);

  const getLastForVehicle = useCallback(async (vehicleId: string) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceEntryRepo(db);
    return repo.getLastForVehicle(vehicleId);
  }, []);

  return {
    addEntry,
    updateEntry,
    deleteEntry,
    addGroup,
    getGroup,
    deleteGroup,
    getLastForVehicle,
  };
}
