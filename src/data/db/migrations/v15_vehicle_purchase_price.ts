import type * as SQLite from 'expo-sqlite';
import { generateUUID } from '../../../utils/uuid';

interface PurchaseCostRow {
  id: string;
  vehicle_id: string;
  amount: number;
  date_ts: number;
  notes: string | null;
  image_paths: string | null;
  created_at: number;
}

interface PurchaseDocumentRow {
  title: string;
  category: string | null;
  notes: string | null;
}

interface PurchaseDocumentPageRow {
  path: string;
}

function parseImagePaths(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((path): path is string => typeof path === 'string') : [];
  } catch {
    return [];
  }
}

async function moveLegacyPurchaseCosts(db: SQLite.SQLiteDatabase): Promise<void> {
  const purchases = await db.getAllAsync<PurchaseCostRow>(
    `SELECT id, vehicle_id, amount, date_ts, notes, image_paths, created_at
     FROM vehicle_costs
     WHERE category = 'purchase'
     ORDER BY vehicle_id, date_ts, created_at, id;`
  );
  const totalsByVehicle = new Map<string, number>();

  for (const purchase of purchases) {
    totalsByVehicle.set(purchase.vehicle_id, (totalsByVehicle.get(purchase.vehicle_id) ?? 0) + purchase.amount);

    const documents = await db.getAllAsync<PurchaseDocumentRow>(
      `SELECT title, category, notes
       FROM documents
       WHERE owner_type = 'cost' AND owner_id = ?
       ORDER BY date_ts, created_at, id;`,
      [purchase.id]
    );
    const pages = await db.getAllAsync<PurchaseDocumentPageRow>(
      `SELECT p.path
       FROM documents d
       JOIN document_pages p ON p.document_id = d.id
       WHERE d.owner_type = 'cost' AND d.owner_id = ?
       ORDER BY d.date_ts, d.created_at, d.id, p.sort_order;`,
      [purchase.id]
    );
    const imagePaths = [...new Set([...parseImagePaths(purchase.image_paths), ...pages.map((page) => page.path)])];
    const noteParts = [purchase.notes?.trim() ?? ''];
    for (const document of documents) {
      const heading = [document.title, document.category].filter(Boolean).join(' · ');
      noteParts.push([heading, document.notes?.trim()].filter(Boolean).join('\n'));
    }
    const notes = noteParts.filter(Boolean).join('\n\n') || null;

    if (notes || imagePaths.length > 0 || documents.length > 0) {
      const documentId = generateUUID();
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO documents
          (id, vehicle_id, owner_type, owner_id, title, category, date_ts, notes, created_at, updated_at)
         VALUES (?, ?, 'vehicle', ?, ?, NULL, ?, ?, ?, ?);`,
        [
          documentId,
          purchase.vehicle_id,
          purchase.vehicle_id,
          'Vehicle Purchase - migrated',
          purchase.date_ts,
          notes,
          purchase.created_at,
          now
        ]
      );
      for (let index = 0; index < imagePaths.length; index += 1) {
        await db.runAsync(
          `INSERT INTO document_pages (id, document_id, path, sort_order)
           VALUES (?, ?, ?, ?);`,
          [generateUUID(), documentId, imagePaths[index], index]
        );
      }
    }
  }

  for (const [vehicleId, purchasePrice] of totalsByVehicle) {
    await db.runAsync('UPDATE vehicles SET purchase_price = COALESCE(purchase_price, 0) + ? WHERE id = ?;', [purchasePrice, vehicleId]);
  }

  await db.runAsync("DELETE FROM vehicle_costs WHERE category = 'purchase';");
  await db.runAsync("DELETE FROM payment_types WHERE id = 'purchase';");
}

export async function migrateLegacyPurchaseCostsInTransaction(db: SQLite.SQLiteDatabase): Promise<void> {
  await moveLegacyPurchaseCosts(db);
}

export async function migrateV15(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('ALTER TABLE vehicles ADD COLUMN purchase_price REAL;');
    await moveLegacyPurchaseCosts(db);
  });
}
