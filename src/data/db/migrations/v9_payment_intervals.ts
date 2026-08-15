import type * as SQLite from "expo-sqlite";
import { generateUUID } from "../../../utils/uuid";

interface TableColumnRow {
  name: string;
}

interface LegacyRecurringRow {
  id: string;
  vehicle_id: string;
  category: string;
  amount: number;
  date_ts: number;
  interval_type: "monthly" | "yearly";
  notes: string | null;
  created_at: number;
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  name: string,
  statement: string,
): Promise<void> {
  const cols = await db.getAllAsync<TableColumnRow>(
    "PRAGMA table_info(vehicle_costs);",
  );
  const hasCol = cols.some((c) => c.name === name);
  if (!hasCol) {
    await db.execAsync(statement);
  }
}

export async function migrateV9(db: SQLite.SQLiteDatabase): Promise<void> {
  await ensureColumn(
    db,
    "kind",
    "ALTER TABLE vehicle_costs ADD COLUMN kind TEXT NOT NULL DEFAULT 'history';",
  );
  await ensureColumn(
    db,
    "interval_days",
    "ALTER TABLE vehicle_costs ADD COLUMN interval_days INTEGER;",
  );
  await ensureColumn(
    db,
    "payment_interval_id",
    "ALTER TABLE vehicle_costs ADD COLUMN payment_interval_id TEXT;",
  );
  await ensureColumn(
    db,
    "interval_due_ts",
    "ALTER TABLE vehicle_costs ADD COLUMN interval_due_ts INTEGER;",
  );

  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_costs_vehicle_kind_date ON vehicle_costs(vehicle_id, kind, date_ts DESC);",
  );
  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_costs_interval_due ON vehicle_costs(payment_interval_id, interval_due_ts);",
  );

  const recurringRows = await db.getAllAsync<LegacyRecurringRow>(
    `SELECT id, vehicle_id, category, amount, date_ts, interval_type, notes, created_at
     FROM vehicle_costs
     WHERE interval_type IN ('monthly', 'yearly')
     ORDER BY vehicle_id ASC, date_ts ASC, created_at ASC;`,
  );

  const seenKeys = new Set<string>();

  await db.withTransactionAsync(async () => {
    for (const row of recurringRows) {
      const key = [
        row.vehicle_id,
        row.category,
        row.amount.toFixed(2),
        row.interval_type,
      ].join("|");

      if (!seenKeys.has(key)) {
        const intervalDays = row.interval_type === "monthly" ? 30 : 365;

        await db.runAsync(
          `INSERT INTO vehicle_costs
            (id, vehicle_id, kind, category, amount, date_ts, interval_type, interval_days, payment_interval_id, interval_due_ts, notes, created_at)
           VALUES (?, ?, 'interval', ?, ?, ?, ?, ?, NULL, NULL, ?, ?);`,
          [
            generateUUID(),
            row.vehicle_id,
            row.category,
            row.amount,
            row.date_ts,
            row.interval_type,
            intervalDays,
            row.notes ?? null,
            row.created_at,
          ],
        );

        seenKeys.add(key);
      }

      await db.runAsync(
        `UPDATE vehicle_costs
         SET kind = 'history',
             interval_type = NULL,
             interval_days = NULL,
             payment_interval_id = NULL,
             interval_due_ts = NULL
         WHERE id = ?;`,
        [row.id],
      );
    }

    await db.runAsync(
      "UPDATE vehicle_costs SET kind = 'history' WHERE kind IS NULL OR kind = '';",
    );
  });
}
