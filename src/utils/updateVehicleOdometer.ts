import type * as SQLite from "expo-sqlite";

export async function recalculateVehicleOdometer(
  db: SQLite.SQLiteDatabase,
  vehicleId: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE vehicles
     SET current_odometer = MAX(
       base_odometer,
       COALESCE((
         SELECT MAX(odometer_km)
         FROM service_entries
         WHERE vehicle_id = ?
       ), 0),
       COALESCE((
         SELECT MAX(odometer_km)
         FROM fuel_entries
         WHERE vehicle_id = ?
       ), 0)
     ),
     updated_at = ?
     WHERE id = ?;`,
    [vehicleId, vehicleId, Date.now(), vehicleId],
  );
}