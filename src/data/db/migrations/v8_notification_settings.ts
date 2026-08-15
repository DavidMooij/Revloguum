import type * as SQLite from "expo-sqlite";

export async function migrateV8(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      kind TEXT PRIMARY KEY NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      offset_days INTEGER NOT NULL DEFAULT 7,
      offset_km INTEGER NOT NULL DEFAULT 0,
      repeat_every_days INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notification_settings_kind
      ON notification_settings(kind);
  `);

  const now = Date.now();

  await db.runAsync(
    `INSERT OR IGNORE INTO notification_settings
      (kind, enabled, offset_days, offset_km, repeat_every_days, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ["payments", 0, 7, 0, 1, now],
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO notification_settings
      (kind, enabled, offset_days, offset_km, repeat_every_days, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ["upcoming_services", 0, 7, 500, 1, now],
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO notification_settings
      (kind, enabled, offset_days, offset_km, repeat_every_days, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ["overdue_services", 0, 3, 100, 1, now],
  );
}
