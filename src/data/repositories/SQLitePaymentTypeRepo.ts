import type * as SQLite from "expo-sqlite";
import type { IPaymentTypeRepo } from "../../domain/repositories/IPaymentTypeRepo";
import type {
  PaymentType,
  CreatePaymentTypeInput,
} from "../../domain/entities/PaymentType";
import { generateUUID } from "../../utils/uuid";

interface PaymentTypeRow {
  id: string;
  name: string;
  translation_key: string | null;
  icon: string;
  is_system: number;
  sort_order: number;
  created_at: number;
}

function rowToEntity(row: PaymentTypeRow): PaymentType {
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

export class SQLitePaymentTypeRepo implements IPaymentTypeRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getAll(): Promise<PaymentType[]> {
    const rows = await this.db.getAllAsync<PaymentTypeRow>(
      `SELECT *
       FROM payment_types
       ORDER BY sort_order ASC, name ASC;`,
    );

    return rows.map(rowToEntity);
  }

  async getById(id: string): Promise<PaymentType | null> {
    const row = await this.db.getFirstAsync<PaymentTypeRow>(
      `SELECT *
       FROM payment_types
       WHERE id = ?
       LIMIT 1;`,
      [id],
    );

    return row ? rowToEntity(row) : null;
  }

  async insert(input: CreatePaymentTypeInput): Promise<PaymentType> {
    const id = generateUUID();
    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO payment_types
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
      `UPDATE payment_types
       SET name = ?, icon = ?
       WHERE id = ?
       AND is_system = 0;`,
      [name, icon, id],
    );
  }

  async delete(id: string): Promise<void> {
    const usage = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM vehicle_costs
       WHERE category = ?;`,
      [id],
    );

    if ((usage?.count ?? 0) > 0) {
      throw new Error("Payment type is in use and cannot be deleted.");
    }

    await this.db.runAsync(
      `DELETE FROM payment_types
       WHERE id = ?
       AND is_system = 0;`,
      [id],
    );
  }
}
