import type * as SQLite from 'expo-sqlite';
import { SYSTEM_SERVICE_TYPES } from '../../../domain/entities/ServiceType';

export async function seedSystemServiceTypes(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = Date.now();
  for (const st of SYSTEM_SERVICE_TYPES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO service_types (id, name, icon, is_system, sort_order, created_at)
       VALUES (?, ?, ?, 1, ?, ?);`,
      [st.id, st.name, st.icon, st.sortOrder, now],
    );
  }
}
