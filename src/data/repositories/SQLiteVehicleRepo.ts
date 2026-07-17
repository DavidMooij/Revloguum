import type * as SQLite from "expo-sqlite";
import type { IVehicleRepo } from "../../domain/repositories/IVehicleRepo";
import type {
  Vehicle,
  VehicleType,
  CreateVehicleInput,
  UpdateVehicleInput,
} from "../../domain/entities/Vehicle";
import { generateUUID } from "../../utils/uuid";

interface VehicleRow {
  id: string;
  make: string;
  model: string;
  year: number | null;
  nickname: string | null;
  current_odometer: number;
  photo_path: string | null;
  default_tank_liters: number | null;
  default_fuel_price: number | null;
  service_intervals: string | null;
  vehicle_type: string | null;
  created_at: number;
  updated_at: number;
}

function rowToEntity(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    nickname: row.nickname,
    currentOdometer: row.current_odometer,
    photoPath: row.photo_path,
    defaultTankLiters: row.default_tank_liters ?? null,
    defaultFuelPrice: row.default_fuel_price ?? null,
    serviceIntervals: row.service_intervals
      ? JSON.parse(row.service_intervals)
      : [],
    vehicleType: (row.vehicle_type as VehicleType) ?? 'motorcycle',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SQLiteVehicleRepo implements IVehicleRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getAll(): Promise<Vehicle[]> {
    const rows = await this.db.getAllAsync<VehicleRow>(
      "SELECT * FROM vehicles ORDER BY created_at ASC;",
    );
    return rows.map(rowToEntity);
  }

  async getById(id: string): Promise<Vehicle | null> {
    const row = await this.db.getFirstAsync<VehicleRow>(
      "SELECT * FROM vehicles WHERE id = ? LIMIT 1;",
      [id],
    );
    return row ? rowToEntity(row) : null;
  }

  async insert(input: CreateVehicleInput): Promise<Vehicle> {
    const id = generateUUID();
    const now = Date.now();
    await this.db.runAsync(
      `INSERT INTO vehicles
         (id, make, model, year, nickname, current_odometer, photo_path,
          default_tank_liters, default_fuel_price, service_intervals,
          vehicle_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.make,
        input.model,
        input.year ?? null,
        input.nickname ?? null,
        input.currentOdometer,
        input.photoPath ?? null,
        input.defaultTankLiters ?? null,
        input.defaultFuelPrice ?? null,
        input.serviceIntervals?.length
          ? JSON.stringify(input.serviceIntervals)
          : null,
        input.vehicleType ?? 'motorcycle',
        now,
        now,
      ],
    );
    return { id, createdAt: now, updatedAt: now, ...input };
  }

  async update(
    id: string,
    input: UpdateVehicleInput,
  ): Promise<Vehicle | null> {
    const sets: string[] = [];
    const values: SQLite.SQLiteBindValue[] = [];

    if (input.make !== undefined)
      (sets.push("make = ?"), values.push(input.make));
    if (input.model !== undefined)
      (sets.push("model = ?"), values.push(input.model));
    if (input.year !== undefined)
      (sets.push("year = ?"), values.push(input.year ?? null));
    if (input.nickname !== undefined)
      (sets.push("nickname = ?"), values.push(input.nickname ?? null));
    if (input.currentOdometer !== undefined)
      (sets.push("current_odometer = ?"), values.push(input.currentOdometer));
    if (input.photoPath !== undefined)
      (sets.push("photo_path = ?"), values.push(input.photoPath ?? null));
    if (input.defaultTankLiters !== undefined)
      (sets.push("default_tank_liters = ?"), values.push(input.defaultTankLiters ?? null));
    if (input.defaultFuelPrice !== undefined)
      (sets.push("default_fuel_price = ?"), values.push(input.defaultFuelPrice ?? null));
    if (input.serviceIntervals !== undefined)
      (sets.push("service_intervals = ?"), values.push(
        input.serviceIntervals?.length ? JSON.stringify(input.serviceIntervals) : null,
      ));
    if (input.vehicleType !== undefined)
      (sets.push("vehicle_type = ?"), values.push(input.vehicleType));

    if (sets.length > 0) {
      sets.push("updated_at = ?");
      values.push(Date.now());
      values.push(id);

      await this.db.runAsync(
        `UPDATE vehicles SET ${sets.join(", ")} WHERE id = ?;`,
        values,
      );
    }

    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM vehicles WHERE id = ?;", [id]);
  }

  async updateOdometer(id: string, odometer: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE vehicles
         SET current_odometer = MAX(current_odometer, ?), updated_at = ?
       WHERE id = ?;`,
      [odometer, Date.now(), id],
    );
  }
}
