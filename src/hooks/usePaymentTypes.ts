import { useState, useCallback, useEffect } from "react";
import { getDatabase } from "../data/db/database";
import { SQLitePaymentTypeRepo } from "../data/repositories/SQLitePaymentTypeRepo";
import type {
  PaymentType,
  CreatePaymentTypeInput,
} from "../domain/entities/PaymentType";

export function usePaymentTypes() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const repo = new SQLitePaymentTypeRepo(db);
      const all = await repo.getAll();
      setPaymentTypes(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addPaymentType = useCallback(
    async (input: CreatePaymentTypeInput) => {
      const db = await getDatabase();
      const repo = new SQLitePaymentTypeRepo(db);
      const pt = await repo.insert(input);
      await refresh();
      return pt;
    },
    [refresh],
  );

  const updatePaymentType = useCallback(
    async (id: string, name: string, icon: string) => {
      const db = await getDatabase();
      const repo = new SQLitePaymentTypeRepo(db);
      await repo.update(id, name, icon);
      await refresh();
    },
    [refresh],
  );

  const deletePaymentType = useCallback(
    async (id: string) => {
      const db = await getDatabase();
      const repo = new SQLitePaymentTypeRepo(db);
      await repo.delete(id);
      await refresh();
    },
    [refresh],
  );

  return {
    paymentTypes,
    loading,
    refresh,
    addPaymentType,
    updatePaymentType,
    deletePaymentType,
  };
}
