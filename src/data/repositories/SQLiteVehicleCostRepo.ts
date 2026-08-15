import type * as SQLite from "expo-sqlite";
import type {
  VehicleCost,
  CreateVehicleCostInput,
  CostCategory,
  IntervalType,
  CostKind,
} from "../../domain/entities/VehicleCost";
import { generateUUID } from "../../utils/uuid";

const HISTORY_KIND: CostKind = "history";
const INTERVAL_KIND: CostKind = "interval";

export interface UpsertPaymentIntervalInput {
  id?: string;
  category: CostCategory;
  amount: number;
  intervalType: Exclude<IntervalType, null>;
  intervalDays: number;
  startDateTs: number;
  notes: string | null;
}

export class SQLiteVehicleCostRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async insert(input: CreateVehicleCostInput): Promise<VehicleCost> {
    const id = generateUUID();
    const now = Date.now();
    const kind = input.kind ?? HISTORY_KIND;
    const intervalType = kind === INTERVAL_KIND ? (input.intervalType ?? null) : null;
    const intervalDays =
      kind === INTERVAL_KIND
        ? input.intervalDays != null
          ? Math.max(1, Math.floor(input.intervalDays))
          : null
        : null;

    await this.db.runAsync(
      `INSERT INTO vehicle_costs
        (id, vehicle_id, kind, category, amount, date_ts, interval_type, interval_days, payment_interval_id, interval_due_ts, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.vehicleId,
        kind,
        input.category,
        input.amount,
        input.dateTs,
        intervalType,
        intervalDays,
        input.paymentIntervalId ?? null,
        input.intervalDueTs ?? null,
        input.notes ?? null,
        now,
      ],
    );

    return {
      id,
      vehicleId: input.vehicleId,
      kind,
      category: input.category,
      amount: input.amount,
      dateTs: input.dateTs,
      intervalType,
      intervalDays,
      paymentIntervalId: input.paymentIntervalId ?? null,
      intervalDueTs: input.intervalDueTs ?? null,
      notes: input.notes ?? null,
      createdAt: now,
    };
  }

  async getAll(vehicleId: string): Promise<VehicleCost[]> {
    return this.getHistory(vehicleId);
  }

  async getHistory(vehicleId: string): Promise<VehicleCost[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM vehicle_costs
       WHERE vehicle_id = ? AND COALESCE(kind, 'history') = 'history'
       ORDER BY date_ts DESC, created_at DESC;`,
      [vehicleId],
    );
    return rows.map(this.rowToEntity);
  }

  async getIntervals(vehicleId: string): Promise<VehicleCost[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM vehicle_costs
       WHERE vehicle_id = ? AND COALESCE(kind, 'history') = 'interval'
       ORDER BY date_ts ASC, created_at ASC;`,
      [vehicleId],
    );
    return rows.map(this.rowToEntity);
  }

  async replaceIntervals(
    vehicleId: string,
    intervals: UpsertPaymentIntervalInput[],
  ): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `DELETE FROM vehicle_costs
         WHERE vehicle_id = ? AND COALESCE(kind, 'history') = 'interval';`,
        [vehicleId],
      );

      const now = Date.now();
      for (const interval of intervals) {
        const id = interval.id ?? generateUUID();
        await this.db.runAsync(
          `INSERT INTO vehicle_costs
            (id, vehicle_id, kind, category, amount, date_ts, interval_type, interval_days, payment_interval_id, interval_due_ts, notes, created_at)
           VALUES (?, ?, 'interval', ?, ?, ?, ?, ?, NULL, NULL, ?, ?);`,
          [
            id,
            vehicleId,
            interval.category,
            interval.amount,
            interval.startDateTs,
            interval.intervalType,
            Math.max(1, Math.floor(interval.intervalDays)),
            interval.notes ?? null,
            now,
          ],
        );
      }
    });
  }

  async update(
    id: string,
    input: Partial<CreateVehicleCostInput>,
  ): Promise<void> {
    const sets: string[] = [];
    const values: SQLite.SQLiteBindValue[] = [];
    if (input.category !== undefined) {
      sets.push("category = ?");
      values.push(input.category);
    }
    if (input.amount !== undefined) {
      sets.push("amount = ?");
      values.push(input.amount);
    }
    if (input.kind !== undefined) {
      sets.push("kind = ?");
      values.push(input.kind);
    }
    if (input.dateTs !== undefined) {
      sets.push("date_ts = ?");
      values.push(input.dateTs);
    }
    if (input.intervalType !== undefined) {
      sets.push("interval_type = ?");
      values.push(input.intervalType ?? null);
    }
    if (input.intervalDays !== undefined) {
      sets.push("interval_days = ?");
      values.push(input.intervalDays != null ? Math.max(1, Math.floor(input.intervalDays)) : null);
    }
    if (input.paymentIntervalId !== undefined) {
      sets.push("payment_interval_id = ?");
      values.push(input.paymentIntervalId ?? null);
    }
    if (input.intervalDueTs !== undefined) {
      sets.push("interval_due_ts = ?");
      values.push(input.intervalDueTs ?? null);
    }
    if (input.notes !== undefined) {
      sets.push("notes = ?");
      values.push(input.notes ?? null);
    }
    if (!sets.length) return;
    values.push(id);
    await this.db.runAsync(
      `UPDATE vehicle_costs SET ${sets.join(", ")} WHERE id = ?;`,
      values,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM vehicle_costs WHERE id = ?;", [id]);
  }

  async getTotalCost(vehicleId: string): Promise<number> {
    const row = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM vehicle_costs
       WHERE vehicle_id = ? AND COALESCE(kind, 'history') = 'history';`,
      [vehicleId],
    );
    return row?.total ?? 0;
  }

  async getCostsByCategory(
    vehicleId: string,
  ): Promise<{ category: CostCategory; total: number }[]> {
    const rows = await this.db.getAllAsync<{ category: string; total: number }>(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM vehicle_costs
       WHERE vehicle_id = ? AND COALESCE(kind, 'history') = 'history'
       GROUP BY category;`,
      [vehicleId],
    );
    return rows.map((r) => ({
      category: r.category as CostCategory,
      total: r.total,
    }));
  }

  async getAllWithDates(vehicleId: string): Promise<{ dateTs: number; amount: number }[]> {
    const rows = await this.db.getAllAsync<{ date_ts: number; amount: number }>(
      `SELECT date_ts, amount
       FROM vehicle_costs
       WHERE vehicle_id = ? AND COALESCE(kind, 'history') = 'history'
       ORDER BY date_ts ASC;`,
      [vehicleId],
    );
    return rows.map((r) => ({ dateTs: r.date_ts, amount: r.amount }));
  }

  private rowToEntity(row: any): VehicleCost {
    const kind: CostKind = row.kind === INTERVAL_KIND ? INTERVAL_KIND : HISTORY_KIND;
    const intervalType: IntervalType =
      row.interval_type === "monthly" ||
      row.interval_type === "yearly" ||
      row.interval_type === "custom"
        ? row.interval_type
        : null;

    const intervalDaysRaw = row.interval_days;
    const derivedDays =
      intervalType === "monthly"
        ? 30
        : intervalType === "yearly"
          ? 365
          : null;

    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      kind,
      category: row.category as CostCategory,
      amount: row.amount,
      dateTs: row.date_ts,
      intervalType,
      intervalDays:
        intervalDaysRaw != null
          ? Math.max(1, Math.floor(intervalDaysRaw))
          : derivedDays,
      paymentIntervalId: row.payment_interval_id ?? null,
      intervalDueTs: row.interval_due_ts ?? null,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
