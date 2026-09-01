import type * as SQLite from "expo-sqlite";
import type {
  DocumentOwnerType,
  DocumentPage,
  SaveDocumentInput,
  VehicleDocument,
} from "../../domain/entities/Document";
import { generateUUID } from "../../utils/uuid";

interface DocumentRow {
  id: string;
  vehicle_id: string;
  owner_type: DocumentOwnerType;
  owner_id: string;
  title: string;
  category: string | null;
  date_ts: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export class SQLiteDocumentRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getForOwner(
    ownerType: DocumentOwnerType,
    ownerId: string,
  ): Promise<VehicleDocument[]> {
    const rows = await this.db.getAllAsync<DocumentRow>(
      `SELECT * FROM documents
       WHERE owner_type = ? AND owner_id = ?
       ORDER BY date_ts DESC, created_at DESC;`,
      [ownerType, ownerId],
    );
    return this.withPages(rows);
  }

  async getForVehicle(vehicleId: string): Promise<VehicleDocument[]> {
    const rows = await this.db.getAllAsync<DocumentRow>(
      `SELECT * FROM documents
       WHERE vehicle_id = ?
       ORDER BY date_ts DESC, created_at DESC;`,
      [vehicleId],
    );
    return this.withPages(rows);
  }

  async getForServiceEntry(entryId: string): Promise<VehicleDocument[]> {
    const entry = await this.db.getFirstAsync<{ group_id: string | null }>(
      "SELECT group_id FROM service_entries WHERE id = ? LIMIT 1;",
      [entryId],
    );
    if (!entry?.group_id) return this.getForOwner("service", entryId);

    const rows = await this.db.getAllAsync<DocumentRow>(
      `SELECT d.* FROM documents d
       WHERE d.owner_type = 'service'
         AND d.owner_id IN (
           SELECT id FROM service_entries WHERE group_id = ?
         )
       ORDER BY d.date_ts DESC, d.created_at DESC;`,
      [entry.group_id],
    );
    return this.withPages(rows);
  }

  async insert(input: SaveDocumentInput): Promise<VehicleDocument> {
    const id = generateUUID();
    const now = Date.now();
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO documents
          (id, vehicle_id, owner_type, owner_id, title, category, date_ts, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          input.vehicleId,
          input.ownerType,
          input.ownerId,
          input.title.trim(),
          input.category?.trim() || null,
          input.dateTs,
          input.notes?.trim() || null,
          now,
          now,
        ],
      );
      for (let index = 0; index < input.pagePaths.length; index += 1) {
        await this.db.runAsync(
          `INSERT INTO document_pages (id, document_id, path, sort_order)
           VALUES (?, ?, ?, ?);`,
          [generateUUID(), id, input.pagePaths[index], index],
        );
      }
    });
    return {
      id,
      vehicleId: input.vehicleId,
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      title: input.title.trim(),
      category: input.category?.trim() || null,
      dateTs: input.dateTs,
      notes: input.notes?.trim() || null,
      pages: input.pagePaths.map((path, sortOrder) => ({
        id: "",
        path,
        sortOrder,
      })),
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(
    id: string,
    input: Pick<SaveDocumentInput, "title" | "category" | "dateTs" | "notes" | "pagePaths">,
  ): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE documents
         SET title = ?, category = ?, date_ts = ?, notes = ?, updated_at = ?
         WHERE id = ?;`,
        [
          input.title.trim(),
          input.category?.trim() || null,
          input.dateTs,
          input.notes?.trim() || null,
          Date.now(),
          id,
        ],
      );
      await this.db.runAsync("DELETE FROM document_pages WHERE document_id = ?;", [id]);
      for (let index = 0; index < input.pagePaths.length; index += 1) {
        await this.db.runAsync(
          `INSERT INTO document_pages (id, document_id, path, sort_order)
           VALUES (?, ?, ?, ?);`,
          [generateUUID(), id, input.pagePaths[index], index],
        );
      }
    });
  }

  async delete(id: string): Promise<string[]> {
    const pages = await this.db.getAllAsync<{ path: string }>(
      "SELECT path FROM document_pages WHERE document_id = ?;",
      [id],
    );
    await this.db.runAsync("DELETE FROM documents WHERE id = ?;", [id]);
    return pages.map((page) => page.path);
  }

  async reassignDocuments(documentIds: string[], ownerId: string): Promise<void> {
    if (documentIds.length === 0) return;
    const placeholders = documentIds.map(() => "?").join(",");
    await this.db.runAsync(
      `UPDATE documents
       SET owner_id = ?, updated_at = ?
       WHERE id IN (${placeholders});`,
      [ownerId, Date.now(), ...documentIds],
    );
  }

  private async withPages(rows: DocumentRow[]): Promise<VehicleDocument[]> {
    if (rows.length === 0) return [];
    const placeholders = rows.map(() => "?").join(",");
    const pages = await this.db.getAllAsync<{
      id: string;
      document_id: string;
      path: string;
      sort_order: number;
    }>(
      `SELECT * FROM document_pages
       WHERE document_id IN (${placeholders})
       ORDER BY sort_order ASC;`,
      rows.map((row) => row.id),
    );
    const pagesByDocument = new Map<string, DocumentPage[]>();
    for (const page of pages) {
      const list = pagesByDocument.get(page.document_id) ?? [];
      list.push({ id: page.id, path: page.path, sortOrder: page.sort_order });
      pagesByDocument.set(page.document_id, list);
    }
    return rows.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      ownerType: row.owner_type,
      ownerId: row.owner_id,
      title: row.title,
      category: row.category,
      dateTs: row.date_ts,
      notes: row.notes,
      pages: pagesByDocument.get(row.id) ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}