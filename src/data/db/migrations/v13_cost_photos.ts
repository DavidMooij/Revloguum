import type * as SQLite from 'expo-sqlite';

interface CostDocumentPageRow {
  owner_id: string;
  path: string;
}

export async function migrateV13(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('ALTER TABLE vehicle_costs ADD COLUMN image_paths TEXT;');

    const pages = await db.getAllAsync<CostDocumentPageRow>(
      `SELECT d.owner_id, p.path
       FROM documents d
       JOIN vehicle_costs c ON c.id = d.owner_id
       JOIN document_pages p ON p.document_id = d.id
       WHERE d.owner_type = 'cost'
       ORDER BY c.id, d.date_ts DESC, d.created_at DESC, d.id, p.sort_order ASC;`
    );

    const imagePathsByCost = new Map<string, string[]>();
    for (const page of pages) {
      const imagePaths = imagePathsByCost.get(page.owner_id) ?? [];
      imagePaths.push(page.path);
      imagePathsByCost.set(page.owner_id, imagePaths);
    }

    for (const [costId, imagePaths] of imagePathsByCost) {
      await db.runAsync('UPDATE vehicle_costs SET image_paths = ? WHERE id = ?;', [JSON.stringify(imagePaths), costId]);
    }

    // Keep the encrypted pages as photos and discard the redundant cost-document metadata.
    await db.runAsync(
      `DELETE FROM documents
       WHERE owner_type = 'cost'
         AND owner_id IN (SELECT id FROM vehicle_costs);`
    );
  });
}
