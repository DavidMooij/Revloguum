import type * as SQLite from "expo-sqlite";
import { SQLiteVehicleRepo } from "../data/repositories/SQLiteVehicleRepo";

export async function updateVehicleOdometerIfHigher(
  db: SQLite.SQLiteDatabase,
  vehicleId: string,
  odometerKm: number,
) {
  const vehicleRepo = new SQLiteVehicleRepo(db);
  const vehicle = await vehicleRepo.getById(vehicleId);

  if (vehicle && odometerKm > vehicle.currentOdometer) {
    await vehicleRepo.update(vehicle.id, {
      currentOdometer: odometerKm,
    });
  }
}