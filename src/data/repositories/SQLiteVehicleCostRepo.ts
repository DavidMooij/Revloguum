import type * as SQLite from "expo-sqlite";
import type {
  VehicleCost,
  CreateVehicleCostInput,
  CostCategory,
  IntervalType,
} from "../../domain/entities/VehicleCost";
import { generateUUID } from "../../utils/uuid";

export class SQLiteVehicleCostRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async insert(input: CreateVehicleCostInput): Promise<VehicleCost> {
    const id = generateUUID();
    const now = Date.now();
    await this.db.runAsync(
      `INSERT INTO vehicle_costs (id, vehicle_id, category, amount, date_ts, interval_type, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.vehicleId,
        input.category,
        input.amount,
        input.dateTs,
        input.intervalType ?? null,
        input.notes ?? null,
        now,
      ],
    );
    return { id, createdAt: now, ...input };
  }

  async getAll(vehicleId: string): Promise<VehicleCost[]> {
    const rows = await this.db.getAllAsync<any>(
      "SELECT * FROM vehicle_costs WHERE vehicle_id = ? ORDER BY date_ts DESC;",
      [vehicleId],
    );
    return rows.map(this.rowToEntity);
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
    if (input.dateTs !== undefined) {
      sets.push("date_ts = ?");
      values.push(input.dateTs);
    }
    if (input.intervalType !== undefined) {
      sets.push("interval_type = ?");
      values.push(input.intervalType ?? null);
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
      `SELECT COALESCE(SUM(amount), 0) AS total FROM vehicle_costs WHERE vehicle_id = ?;`,
      [vehicleId],
    );
    return row?.total ?? 0;
  }

  private rowToEntity(row: any): VehicleCost {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      category: row.category as CostCategory,
      amount: row.amount,
      dateTs: row.date_ts,
      intervalType: row.interval_type as IntervalType,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
