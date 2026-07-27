import type * as SQLite from "expo-sqlite";
import { SYSTEM_SERVICE_TYPES } from "../../../domain/entities/ServiceType";

export async function migrateV6(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE service_types ADD COLUMN translation_key TEXT;
  `);

  for (const st of SYSTEM_SERVICE_TYPES) {
    if (st.translationKey) {
      await db.runAsync(
        `UPDATE service_types SET translation_key = ? WHERE id = ?;`,
        [st.translationKey, st.id],
      );
    }
  }
}
