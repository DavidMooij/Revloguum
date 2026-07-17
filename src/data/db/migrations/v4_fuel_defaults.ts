import type * as SQLite from 'expo-sqlite';

export async function migrateV4(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync('ALTER TABLE vehicles ADD COLUMN default_tank_liters REAL;');
  await db.runAsync('ALTER TABLE vehicles ADD COLUMN default_fuel_price REAL;');
  await db.runAsync('ALTER TABLE vehicles ADD COLUMN service_intervals TEXT;');
}
