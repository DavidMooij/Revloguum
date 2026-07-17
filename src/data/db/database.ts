import * as SQLite from 'expo-sqlite';
import { getDatabaseKey } from '../../security/keyManager';
import { runMigrations } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const key = await getDatabaseKey();

    const db = await SQLite.openDatabaseAsync('revlog.db');

    await db.runAsync(`PRAGMA key = '${key}';`);

    // Verify encryption works
    await db.runAsync('SELECT count(*) FROM sqlite_master;');

    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA cache_size = -8000;');
    await db.execAsync('PRAGMA synchronous = NORMAL;');
    await db.execAsync('PRAGMA temp_store = MEMORY;');

    await runMigrations(db);

    _db = db;
    return db;
  })();

  return _initPromise;
}

export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
    _initPromise = null;
  }
}