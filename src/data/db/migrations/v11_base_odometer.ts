import type * as SQLite from "expo-sqlite";

export async function migrateV11(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE vehicles
      ADD COLUMN base_odometer INTEGER NOT NULL DEFAULT 0;

    UPDATE vehicles
    SET base_odometer = current_odometer;
  `);
}