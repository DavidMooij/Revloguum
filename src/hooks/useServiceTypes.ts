import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '../data/db/database';
import { SQLiteServiceTypeRepo } from '../data/repositories/SQLiteServiceTypeRepo';
import type { ServiceType, CreateServiceTypeInput } from '../domain/entities/ServiceType';

export function useServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const repo = new SQLiteServiceTypeRepo(db);
      const all = await repo.getAll();
      setServiceTypes(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addServiceType = useCallback(async (input: CreateServiceTypeInput) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceTypeRepo(db);
    const st = await repo.insert(input);
    await refresh();
    return st;
  }, [refresh]);

  const updateServiceType = useCallback(async (id: string, name: string, icon: string) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceTypeRepo(db);
    await repo.update(id, name, icon);
    await refresh();
  }, [refresh]);

  const deleteServiceType = useCallback(async (id: string) => {
    const db = await getDatabase();
    const repo = new SQLiteServiceTypeRepo(db);
    await repo.delete(id);
    await refresh();
  }, [refresh]);

  return {
    serviceTypes,
    loading,
    refresh,
    addServiceType,
    updateServiceType,
    deleteServiceType,
  };
}
