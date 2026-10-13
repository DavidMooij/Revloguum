import type * as SQLite from 'expo-sqlite';
import type { OdometerTimelineBounds } from '../../domain/services/odometerTimeline';

type EntryTable = 'fuel_entries' | 'service_entries';
type CandidateRow = { date_ts: number };
type OdometerRow = { odometer_km: number | null };

function localDayBounds(timestamp: number) {
  const start = new Date(timestamp);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
}

export class SQLiteOdometerTimelineRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getBounds(vehicleId: string, dateTs: number, excludedEntryIds: readonly string[] = []): Promise<OdometerTimelineBounds> {
    const targetDay = localDayBounds(dateTs);
    const [previousFuel, previousService, nextFuel, nextService] = await Promise.all([
      this.getNearestDate('fuel_entries', vehicleId, targetDay.start, 'previous', excludedEntryIds),
      this.getNearestDate('service_entries', vehicleId, targetDay.start, 'previous', excludedEntryIds),
      this.getNearestDate('fuel_entries', vehicleId, targetDay.end, 'next', excludedEntryIds),
      this.getNearestDate('service_entries', vehicleId, targetDay.end, 'next', excludedEntryIds)
    ]);

    const previousTimestamp = this.nearest(previousFuel, previousService, 'previous');
    const nextTimestamp = this.nearest(nextFuel, nextService, 'next');
    const previousDay = previousTimestamp === null ? null : localDayBounds(previousTimestamp);
    const nextDay = nextTimestamp === null ? null : localDayBounds(nextTimestamp);

    const [previousMax, nextMin] = await Promise.all([
      previousDay ? this.getDayExtreme(vehicleId, previousDay.start, previousDay.end, 'MAX', excludedEntryIds) : null,
      nextDay ? this.getDayExtreme(vehicleId, nextDay.start, nextDay.end, 'MIN', excludedEntryIds) : null
    ]);

    return { previousMax, nextMin };
  }

  private async getNearestDate(
    table: EntryTable,
    vehicleId: string,
    boundaryTs: number,
    direction: 'previous' | 'next',
    excludedEntryIds: readonly string[]
  ): Promise<number | null> {
    const comparison = direction === 'previous' ? '<' : '>=';
    const order = direction === 'previous' ? 'DESC' : 'ASC';
    const exclusion = this.exclusionClause(excludedEntryIds);
    const row = await this.db.getFirstAsync<CandidateRow>(
      `SELECT date_ts FROM ${table}
       WHERE vehicle_id = ? AND date_ts ${comparison} ?${exclusion.sql}
       ORDER BY date_ts ${order}
       LIMIT 1;`,
      [vehicleId, boundaryTs, ...exclusion.params]
    );
    return row?.date_ts ?? null;
  }

  private async getDayExtreme(
    vehicleId: string,
    startTs: number,
    endTs: number,
    aggregate: 'MAX' | 'MIN',
    excludedEntryIds: readonly string[]
  ): Promise<number | null> {
    const exclusion = this.exclusionClause(excludedEntryIds);
    const row = await this.db.getFirstAsync<OdometerRow>(
      `SELECT ${aggregate}(odometer_km) AS odometer_km
       FROM (
         SELECT odometer_km FROM fuel_entries
         WHERE vehicle_id = ? AND date_ts >= ? AND date_ts < ?${exclusion.sql}
         UNION ALL
         SELECT odometer_km FROM service_entries
         WHERE vehicle_id = ? AND date_ts >= ? AND date_ts < ?${exclusion.sql}
       );`,
      [vehicleId, startTs, endTs, ...exclusion.params, vehicleId, startTs, endTs, ...exclusion.params]
    );
    return row?.odometer_km ?? null;
  }

  private exclusionClause(excludedEntryIds: readonly string[]) {
    if (excludedEntryIds.length === 0) return { sql: '', params: [] as string[] };
    const placeholders = excludedEntryIds.map(() => '?').join(', ');
    return { sql: ` AND id NOT IN (${placeholders})`, params: [...excludedEntryIds] };
  }

  private nearest(first: number | null, second: number | null, direction: 'previous' | 'next') {
    if (first === null) return second;
    if (second === null) return first;
    return direction === 'previous' ? Math.max(first, second) : Math.min(first, second);
  }
}
