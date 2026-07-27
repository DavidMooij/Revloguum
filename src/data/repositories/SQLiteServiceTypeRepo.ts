import type * as SQLite from "expo-sqlite";
import type { IServiceTypeRepo } from "../../domain/repositories/IServiceTypeRepo";
import type {
  ServiceType,
  CreateServiceTypeInput,
} from "../../domain/entities/ServiceType";
import { generateUUID } from "../../utils/uuid";

interface ServiceTypeRow {
  id: string;
  name: string;
  translation_key: string | null;
  icon: string;
  is_system: number;
  sort_order: number;
  created_at: number;
}

function rowToEntity(row: ServiceTypeRow): ServiceType {
  return {
    id: row.id,
    name: row.name,
    translationKey: row.translation_key ?? undefined,
    icon: row.icon,
    isSystem: row.is_system === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export class SQLiteServiceTypeRepo implements IServiceTypeRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getAll(): Promise<ServiceType[]> {
    const rows = await this.db.getAllAsync<ServiceTypeRow>(
      `SELECT *
      FROM service_types
      ORDER BY sort_order ASC, name ASC;`,
    );

    return rows.map(rowToEntity);
  }

  async getById(id: string): Promise<ServiceType | null> {
    const row = await this.db.getFirstAsync<ServiceTypeRow>(
      `SELECT *
      FROM service_types
      WHERE id = ?
      LIMIT 1;`,
      [id],
    );

    return row ? rowToEntity(row) : null;
  }

  async insert(input: CreateServiceTypeInput): Promise<ServiceType> {
    const id = generateUUID();
    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO service_types
      (
        id,
        name,
        translation_key,
        icon,
        is_system,
        sort_order,
        created_at
      )
      VALUES (?, ?, ?, ?, 0, ?, ?);`,
      [
        id,
        input.name,
        input.translationKey ?? null,
        input.icon,
        input.sortOrder,
        now,
      ],
    );

    return {
      id,
      name: input.name,
      translationKey: input.translationKey,
      icon: input.icon,
      isSystem: false,
      sortOrder: input.sortOrder,
      createdAt: now,
    };
  }

  async update(id: string, name: string, icon: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE service_types
      SET name = ?, icon = ?
      WHERE id = ?
      AND is_system = 0;`,
      [name, icon, id],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync(
      `DELETE FROM service_types
      WHERE id = ?
      AND is_system = 0;`,
      [id],
    );
  }
}
