import type { ServiceEntry } from "@/domain/entities/ServiceEntry";
import type { ServiceInterval, Vehicle } from "@/domain/entities/Vehicle";

const DAY_MS = 86400000;

export interface ServiceDueStatus {
  interval: ServiceInterval;
  lastEntry: ServiceEntry | null;
  neverDone: boolean;
  nextDays: number | null;
  nextKm: number | null;
  daysOverdue: number | null;
  kmOverdue: number | null;
  dueDateTs: number | null;
}

export function isServiceOverdue(status: ServiceDueStatus): boolean {
  return status.daysOverdue !== null || status.kmOverdue !== null;
}

export function computeServiceDueStatus(input: {
  interval: ServiceInterval;
  vehicle: Pick<Vehicle, "createdAt" | "currentOdometer">;
  lastEntry: ServiceEntry | null;
  nowTs?: number;
}): ServiceDueStatus {
  const { interval, vehicle, lastEntry } = input;
  const nowTs = input.nowTs ?? Date.now();

  const baselineDateTs = lastEntry?.dateTs ?? vehicle.createdAt;
  const baselineOdo = lastEntry?.odometerKm ?? 0;
  const daysSince = (nowTs - baselineDateTs) / DAY_MS;
  const kmSinceRaw = vehicle.currentOdometer - baselineOdo;
  const kmSince = Math.max(0, kmSinceRaw);

  let nextDays: number | null = null;
  let nextKm: number | null = null;
  let daysOverdue: number | null = null;
  let kmOverdue: number | null = null;
  let dueDateTs: number | null = null;

  if (interval.intervalDays != null) {
    const intervalDays = interval.intervalDays;
    dueDateTs = baselineDateTs + intervalDays * DAY_MS;
    nextDays = Math.max(Math.ceil(intervalDays - daysSince), 0);

    // Overdue starts only after the due threshold has been exceeded.
    if (daysSince > intervalDays) {
      daysOverdue = Math.floor(daysSince - intervalDays);
    }
  }

  if (interval.intervalKm != null) {
    const intervalKm = interval.intervalKm;
    nextKm = Math.max(intervalKm - kmSince, 0);

    // Overdue starts only after the due threshold has been exceeded.
    if (kmSince > intervalKm) {
      kmOverdue = Math.floor(kmSince - intervalKm);
    }
  }

  return {
    interval,
    lastEntry,
    neverDone: !lastEntry,
    nextDays,
    nextKm,
    daysOverdue,
    kmOverdue,
    dueDateTs,
  };
}

export function isUpcomingByKm(
  status: ServiceDueStatus,
  offsetKm: number,
): boolean {
  if (status.nextKm == null) return false;
  return !isServiceOverdue(status) && status.nextKm > 0 && status.nextKm <= offsetKm;
}

export function isOverdueByKm(
  status: ServiceDueStatus,
  offsetKm: number,
): boolean {
  if (status.kmOverdue == null) return false;
  return status.kmOverdue >= offsetKm;
}
