import type * as SQLite from 'expo-sqlite';

export async function migrateV1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id               TEXT PRIMARY KEY NOT NULL,
      make             TEXT NOT NULL,
      model            TEXT NOT NULL,
      year             INTEGER,
      nickname         TEXT,
      current_odometer INTEGER NOT NULL DEFAULT 0,
      photo_path       TEXT,
      created_at       INTEGER NOT NULL,
      updated_at       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_types (
      id         TEXT PRIMARY KEY NOT NULL,
      name       TEXT NOT NULL UNIQUE,
      icon       TEXT NOT NULL DEFAULT 'wrench',
      is_system  INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_entries (
      id               TEXT PRIMARY KEY NOT NULL,
      vehicle_id       TEXT NOT NULL,
      service_type_id  TEXT NOT NULL,
      date_ts          INTEGER NOT NULL,
      odometer_km      INTEGER NOT NULL,
      cost             REAL,
      notes            TEXT,
      created_at       INTEGER NOT NULL,
      updated_at       INTEGER NOT NULL,
      FOREIGN KEY (vehicle_id)   REFERENCES vehicles(id)   ON DELETE CASCADE,
      FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_entries_vehicle ON service_entries(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_entries_date       ON service_entries(date_ts DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_odometer   ON service_entries(odometer_km DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_type       ON service_entries(service_type_id);
    CREATE INDEX IF NOT EXISTS idx_entries_vehicle_date  ON service_entries(vehicle_id, date_ts DESC);
  `);
}
