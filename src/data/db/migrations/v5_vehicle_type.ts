import type * as SQLite from 'expo-sqlite';

export async function migrateV5(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE vehicles ADD COLUMN vehicle_type TEXT NOT NULL DEFAULT 'motorcycle';
  `);
}
