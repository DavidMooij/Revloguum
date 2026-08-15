import type * as SQLite from "expo-sqlite";
import type {
  FuelEntry,
  CreateFuelEntryInput,
  UpdateFuelEntryInput,
  FuelFilter,
  FuelStats,
} from "../../domain/entities/FuelEntry";
import { generateUUID } from "../../utils/uuid";

export class SQLiteFuelRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getById(id: string): Promise<FuelEntry | null> {
    const row = await this.db.getFirstAsync<any>(
      `SELECT * FROM fuel_entries WHERE id = ? LIMIT 1;`,
      [id],
    );

    return row ? this.rowToEntity(row) : null;
  }

  async insert(input: CreateFuelEntryInput): Promise<FuelEntry> {
    const id = generateUUID();
    const now = Date.now();
    await this.db.runAsync(
      `INSERT INTO fuel_entries (id, vehicle_id, date_ts, odometer_km, liters, cost, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.vehicleId,
        input.dateTs,
        input.odometerKm,
        input.liters,
        input.cost,
        input.notes ?? null,
        now,
      ],
    );
    return { id, createdAt: now, ...input };
  }

  async fetchFiltered(filter: FuelFilter): Promise<FuelEntry[]> {
    const conditions: string[] = [];
    const params: SQLite.SQLiteBindValue[] = [];

    if (filter.vehicleId) {
      conditions.push("vehicle_id = ?");
      params.push(filter.vehicleId);
    }
    if (filter.dateFrom) {
      conditions.push("date_ts >= ?");
      params.push(filter.dateFrom);
    }
    if (filter.dateTo) {
      conditions.push("date_ts <= ?");
      params.push(filter.dateTo);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM fuel_entries ${where} ORDER BY date_ts DESC LIMIT ? OFFSET ?;`,
      [...params, filter.limit ?? 100, filter.offset ?? 0],
    );
    return rows.map(this.rowToEntity);
  }

  async getStats(filter: FuelFilter): Promise<FuelStats> {
    const conditions: string[] = [];
    const params: SQLite.SQLiteBindValue[] = [];
    if (filter.vehicleId) {
      conditions.push("vehicle_id = ?");
      params.push(filter.vehicleId);
    }
    if (filter.dateFrom) {
      conditions.push("date_ts >= ?");
      params.push(filter.dateFrom);
    }
    if (filter.dateTo) {
      conditions.push("date_ts <= ?");
      params.push(filter.dateTo);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const row = await this.db.getFirstAsync<any>(
      `SELECT
         COALESCE(SUM(liters), 0) AS total_liters,
         COALESCE(SUM(cost), 0)   AS total_cost,
         COUNT(*)                  AS total_entries,
         MAX(odometer_km)          AS max_odo,
         MIN(odometer_km)          AS min_odo
       FROM fuel_entries ${where};`,
      params,
    );

    const totalLiters = row?.total_liters ?? 0;
    const totalCost = row?.total_cost ?? 0;
    const totalEntries = row?.total_entries ?? 0;
    const kmRange = (row?.max_odo ?? 0) - (row?.min_odo ?? 0);

    return {
      totalLiters,
      totalCost,
      totalEntries,
      avgCostPerLiter: totalLiters > 0 ? totalCost / totalLiters : 0,
      avgConsumption: kmRange > 0 ? (totalLiters / kmRange) * 100 : 0,
    };
  }

  async update(id: string, input: UpdateFuelEntryInput): Promise<void> {
    const sets: string[] = [];
    const params: SQLite.SQLiteBindValue[] = [];
    if (input.dateTs !== undefined) {
      sets.push("date_ts = ?");
      params.push(input.dateTs);
    }
    if (input.odometerKm !== undefined) {
      sets.push("odometer_km = ?");
      params.push(input.odometerKm);
    }
    if (input.liters !== undefined) {
      sets.push("liters = ?");
      params.push(input.liters);
    }
    if (input.cost !== undefined) {
      sets.push("cost = ?");
      params.push(input.cost);
    }
    if (input.notes !== undefined) {
      sets.push("notes = ?");
      params.push(input.notes ?? null);
    }
    if (sets.length === 0) return;
    params.push(id);
    await this.db.runAsync(
      `UPDATE fuel_entries SET ${sets.join(", ")} WHERE id = ?;`,
      params,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM fuel_entries WHERE id = ?;", [id]);
  }

  private rowToEntity(row: any): FuelEntry {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      dateTs: row.date_ts,
      odometerKm: row.odometer_km,
      liters: row.liters,
      cost: row.cost,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
