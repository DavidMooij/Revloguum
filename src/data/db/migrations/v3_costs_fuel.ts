import type * as SQLite from 'expo-sqlite';

export async function migrateV3(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS vehicle_costs (
      id            TEXT PRIMARY KEY NOT NULL,
      vehicle_id    TEXT NOT NULL,
      category      TEXT NOT NULL,
      amount        REAL NOT NULL,
      date_ts       INTEGER NOT NULL,
      interval_type TEXT,
      notes         TEXT,
      created_at    INTEGER NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fuel_entries (
      id            TEXT PRIMARY KEY NOT NULL,
      vehicle_id    TEXT NOT NULL,
      date_ts       INTEGER NOT NULL,
      odometer_km   INTEGER NOT NULL,
      liters        REAL NOT NULL,
      cost          REAL NOT NULL,
      notes         TEXT,
      created_at    INTEGER NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_costs_vehicle ON vehicle_costs(vehicle_id, date_ts DESC);
    CREATE INDEX IF NOT EXISTS idx_fuel_vehicle  ON fuel_entries(vehicle_id, date_ts DESC);
    CREATE INDEX IF NOT EXISTS idx_fuel_date        ON fuel_entries(date_ts DESC);
  `);
}