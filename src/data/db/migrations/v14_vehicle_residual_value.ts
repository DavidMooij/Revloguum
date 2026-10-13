import type * as SQLite from 'expo-sqlite';

export async function migrateV14(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync('ALTER TABLE vehicles ADD COLUMN residual_value REAL;');
}
