import type * as SQLite from "expo-sqlite";

export async function migrateV12(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS documents (
      id         TEXT PRIMARY KEY NOT NULL,
      vehicle_id TEXT NOT NULL,
      owner_type TEXT NOT NULL CHECK(owner_type IN ('vehicle', 'service', 'cost')),
      owner_id   TEXT NOT NULL,
      title      TEXT NOT NULL,
      category   TEXT,
      date_ts    INTEGER NOT NULL,
      notes      TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_pages (
      id          TEXT PRIMARY KEY NOT NULL,
      document_id TEXT NOT NULL,
      path        TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_documents_vehicle
      ON documents(vehicle_id, date_ts DESC);
    CREATE INDEX IF NOT EXISTS idx_documents_owner
      ON documents(owner_type, owner_id, date_ts DESC);
    CREATE INDEX IF NOT EXISTS idx_document_pages_document
      ON document_pages(document_id, sort_order);

    CREATE TRIGGER IF NOT EXISTS delete_service_documents
    AFTER DELETE ON service_entries
    BEGIN
      DELETE FROM documents WHERE owner_type = 'service' AND owner_id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS delete_cost_documents
    AFTER DELETE ON vehicle_costs
    BEGIN
      DELETE FROM documents WHERE owner_type = 'cost' AND owner_id = OLD.id;
    END;
  `);
}