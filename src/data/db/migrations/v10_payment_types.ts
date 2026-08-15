import type * as SQLite from "expo-sqlite";
import { SYSTEM_PAYMENT_TYPES } from "../../../domain/entities/PaymentType";

interface ExistingCategoryRow {
  category: string;
}

interface ExistingNameRow {
  name: string;
}

function titleCase(input: string): string {
  return input
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function migrateV10(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payment_types (
      id              TEXT PRIMARY KEY NOT NULL,
      name            TEXT NOT NULL UNIQUE,
      translation_key TEXT,
      icon            TEXT NOT NULL DEFAULT 'receipt',
      is_system       INTEGER NOT NULL DEFAULT 0,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_payment_types_sort ON payment_types(sort_order, name);
  `);

  const now = Date.now();

  for (const pt of SYSTEM_PAYMENT_TYPES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO payment_types
      (
        id,
        name,
        translation_key,
        icon,
        is_system,
        sort_order,
        created_at
      )
      VALUES (?, ?, ?, ?, 1, ?, ?);`,
      [
        pt.id,
        pt.name,
        pt.translationKey ?? null,
        pt.icon,
        pt.sortOrder,
        now,
      ],
    );
  }

  const rows = await db.getAllAsync<ExistingCategoryRow>(
    `SELECT DISTINCT category
     FROM vehicle_costs
     WHERE category IS NOT NULL AND TRIM(category) != '';`,
  );

  if (rows.length === 0) return;

  const nameRows = await db.getAllAsync<ExistingNameRow>(
    "SELECT name FROM payment_types;",
  );
  const usedNames = new Set(nameRows.map((r) => r.name.toLowerCase()));

  for (const row of rows) {
    const categoryId = row.category;

    const existing = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM payment_types WHERE id = ? LIMIT 1;",
      [categoryId],
    );

    if (existing) continue;

    const baseName = titleCase(categoryId);
    let name = baseName || categoryId;
    let i = 2;

    while (usedNames.has(name.toLowerCase())) {
      name = `${baseName} ${i}`;
      i += 1;
    }

    usedNames.add(name.toLowerCase());

    await db.runAsync(
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
      VALUES (?, ?, NULL, 'receipt', 0, 999, ?);`,
      [categoryId, name, now],
    );
  }
}
