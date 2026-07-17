import type * as SQLite from 'expo-sqlite';

export async function migrateV2(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE service_entries ADD COLUMN image_paths TEXT;
  `);
}