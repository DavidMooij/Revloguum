import type * as SQLite from 'expo-sqlite';
import { migrateV1 } from './v1_initial';
import { seedSystemServiceTypes } from '../seeds/serviceTypes';
import { migrateV2 } from './v2_images';
import { migrateV3 } from './v3_costs_fuel';
import { migrateV4 } from './v4_fuel_defaults';
import { migrateV5 } from './v5_vehicle_type';
import { migrateV6 } from './v6_serviceTypeTranslationKey';

type Migration = (db: SQLite.SQLiteDatabase) => Promise<void>;

const MIGRATIONS: Migration[] = [migrateV1, migrateV2, migrateV3, migrateV4, migrateV5, migrateV6];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1;',
  );
  const currentVersion = row?.version ?? 0;

  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    await MIGRATIONS[i](db);
    await db.runAsync('DELETE FROM schema_version;');
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?);', [i + 1]);
  }

  if (currentVersion === 0) {
    await seedSystemServiceTypes(db);
  }
}
