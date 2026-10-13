import { useCallback } from 'react';
import { getDatabase } from '../data/db/database';
import { SQLiteOdometerTimelineRepo } from '../data/repositories/SQLiteOdometerTimelineRepo';
import { validateOdometerInTimeline } from '../domain/services/odometerTimeline';

export function useOdometerTimelineValidation() {
  return useCallback(async (vehicleId: string, dateTs: number, odometerKm: number, excludedEntryIds: readonly string[] = []) => {
    const db = await getDatabase();
    const repo = new SQLiteOdometerTimelineRepo(db);
    const bounds = await repo.getBounds(vehicleId, dateTs, excludedEntryIds);
    return validateOdometerInTimeline(odometerKm, bounds);
  }, []);
}
