import type * as SQLite from "expo-sqlite";

export async function migrateV7(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE service_entries ADD COLUMN group_id TEXT;
  `);
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_entries_group ON service_entries(group_id);
  `);
}
