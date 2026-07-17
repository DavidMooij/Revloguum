import type * as SQLite from "expo-sqlite";
import type { IServiceEntryRepo } from "../../domain/repositories/IServiceEntryRepo";
import type {
  ServiceEntry,
  ServiceEntryWithDetails,
  CreateServiceEntryInput,
  UpdateServiceEntryInput,
  ServiceEntryFilter,
} from "../../domain/entities/ServiceEntry";
import { generateUUID } from "../../utils/uuid";

interface EntryRow {
  id: string;
  vehicle_id: string;
  service_type_id: string;
  date_ts: number;
  odometer_km: number;
  cost: number | null;
  notes: string | null;
  image_paths: string;
  created_at: number;
  updated_at: number;
}

interface EntryWithDetailsRow extends EntryRow {
  service_type_name: string;
  service_type_icon: string;
  vehicle_display_name: string;
}

function rowToEntry(row: EntryRow): ServiceEntry {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    serviceTypeId: row.service_type_id,
    dateTs: row.date_ts,
    odometerKm: row.odometer_km,
    cost: row.cost,
    notes: row.notes,
    imagePaths: JSON.parse(row.image_paths ?? "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToEntryWithDetails(
  row: EntryWithDetailsRow,
): ServiceEntryWithDetails {
  return {
    ...rowToEntry(row),
    serviceTypeName: row.service_type_name,
    serviceTypeIcon: row.service_type_icon,
    vehicleDisplayName: row.vehicle_display_name,
  };
}

const WITH_DETAILS_SELECT = `
  SELECT
    e.id, e.vehicle_id, e.service_type_id, e.date_ts, e.odometer_km,
    e.cost, e.notes, e.image_paths, e.created_at, e.updated_at,
    st.name AS service_type_name,
    st.icon AS service_type_icon,
    COALESCE(m.nickname, m.make || ' ' || m.model) AS vehicle_display_name
  FROM service_entries e
  JOIN service_types st ON st.id = e.service_type_id
  JOIN vehicles   m  ON m.id  = e.vehicle_id
`;

export class SQLiteServiceEntryRepo implements IServiceEntryRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getById(id: string): Promise<ServiceEntryWithDetails | null> {
    const row = await this.db.getFirstAsync<EntryWithDetailsRow>(
      `${WITH_DETAILS_SELECT} WHERE e.id = ? LIMIT 1;`,
      [id],
    );
    return row ? rowToEntryWithDetails(row) : null;
  }

  async fetchFiltered(
    filter: ServiceEntryFilter,
  ): Promise<ServiceEntryWithDetails[]> {
    const conditions: string[] = [];
    const params: SQLite.SQLiteBindValue[] = [];

    if (filter.vehicleId) {
      conditions.push("e.vehicle_id = ?");
      params.push(filter.vehicleId);
    }
    if (filter.serviceTypeIds && filter.serviceTypeIds.length > 0) {
      const placeholders = filter.serviceTypeIds.map(() => "?").join(",");
      conditions.push(`e.service_type_id IN (${placeholders})`);
      params.push(...filter.serviceTypeIds);
    }
    if (filter.dateFrom !== undefined) {
      conditions.push("e.date_ts >= ?");
      params.push(filter.dateFrom);
    }
    if (filter.dateTo !== undefined) {
      conditions.push("e.date_ts <= ?");
      params.push(filter.dateTo);
    }
    if (filter.odometerMin !== undefined) {
      conditions.push("e.odometer_km >= ?");
      params.push(filter.odometerMin);
    }
    if (filter.odometerMax !== undefined) {
      conditions.push("e.odometer_km <= ?");
      params.push(filter.odometerMax);
    }
    if (filter.searchText?.trim()) {
      conditions.push("(st.name LIKE ? OR e.notes LIKE ?)");
      const q = `%${filter.searchText.trim()}%`;
      params.push(q, q);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filter.limit ?? 100;
    const offset = filter.offset ?? 0;

    const rows = await this.db.getAllAsync<EntryWithDetailsRow>(
      `${WITH_DETAILS_SELECT}
       ${where}
       ORDER BY e.date_ts DESC, e.odometer_km DESC
       LIMIT ? OFFSET ?;`,
      [...params, limit, offset],
    );
    return rows.map(rowToEntryWithDetails);
  }

  async getLastForVehicle(
    vehicleId: string,
  ): Promise<ServiceEntry | null> {
    const row = await this.db.getFirstAsync<EntryRow>(
      `SELECT * FROM service_entries
       WHERE vehicle_id = ?
       ORDER BY date_ts DESC, odometer_km DESC
       LIMIT 1;`,
      [vehicleId],
    );
    return row ? rowToEntry(row) : null;
  }

  async getLastByTypeForVehicle(
    vehicleId: string,
    serviceTypeId: string,
  ): Promise<ServiceEntry | null> {
    const row = await this.db.getFirstAsync<EntryRow>(
      `SELECT * FROM service_entries
       WHERE vehicle_id = ? AND service_type_id = ?
       ORDER BY date_ts DESC LIMIT 1;`,
      [vehicleId, serviceTypeId],
    );
    return row ? rowToEntry(row) : null;
  }

  async insert(input: CreateServiceEntryInput): Promise<ServiceEntry> {
    const id = generateUUID();
    const now = Date.now();
    await this.db.runAsync(
      `INSERT INTO service_entries
         (id, vehicle_id, service_type_id, date_ts, odometer_km, cost, notes, image_paths, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.vehicleId,
        input.serviceTypeId,
        input.dateTs,
        input.odometerKm,
        input.cost ?? null,
        input.notes?.trim() || null,
        input.imagePaths
          ? JSON.stringify(input.imagePaths)
          : JSON.stringify([]),
        now,
        now,
      ],
    );
    await this.db.runAsync(
      `UPDATE vehicles
         SET current_odometer = MAX(current_odometer, ?), updated_at = ?
       WHERE id = ?;`,
      [input.odometerKm, now, input.vehicleId],
    );
    return {
      id,
      createdAt: now,
      updatedAt: now,
      vehicleId: input.vehicleId,
      serviceTypeId: input.serviceTypeId,
      dateTs: input.dateTs,
      odometerKm: input.odometerKm,
      cost: input.cost ?? null,
      notes: input.notes ?? null,
      imagePaths: input.imagePaths ?? [],
    };
  }

  async update(id: string, input: UpdateServiceEntryInput): Promise<void> {
    const sets: string[] = [];
    const values: SQLite.SQLiteBindValue[] = [];

    if (input.serviceTypeId !== undefined) {
      sets.push("service_type_id = ?");
      values.push(input.serviceTypeId);
    }
    if (input.dateTs !== undefined) {
      sets.push("date_ts = ?");
      values.push(input.dateTs);
    }
    if (input.odometerKm !== undefined) {
      sets.push("odometer_km = ?");
      values.push(input.odometerKm);
    }
    if (input.cost !== undefined) {
      sets.push("cost = ?");
      values.push(input.cost ?? null);
    }
    if (input.notes !== undefined) {
      sets.push("notes = ?");
      values.push(input.notes?.trim() || null);
    }
    if (input.imagePaths !== undefined) {
      sets.push("image_paths = ?");
      values.push(JSON.stringify(input.imagePaths ?? []));
    }

    if (sets.length === 0) return;
    sets.push("updated_at = ?");
    values.push(Date.now(), id);
    await this.db.runAsync(
      `UPDATE service_entries SET ${sets.join(", ")} WHERE id = ?;`,
      values,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM service_entries WHERE id = ?;", [id]);
  }

  async getTotalCostForVehicle(vehicleId: string): Promise<number> {
    const row = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(cost), 0) AS total
       FROM service_entries WHERE vehicle_id = ? AND cost IS NOT NULL;`,
      [vehicleId],
    );
    return row?.total ?? 0;
  }

  async getCountForVehicle(vehicleId: string): Promise<number> {
    const row = await this.db.getFirstAsync<{ cnt: number }>(
      "SELECT COUNT(*) AS cnt FROM service_entries WHERE vehicle_id = ?;",
      [vehicleId],
    );
    return row?.cnt ?? 0;
  }
}
