import type { CostCategory, IntervalType, VehicleCost } from "@/domain/entities/VehicleCost";

const DAY_MS = 86400000;
const MAX_OCCURRENCES = 10000;

export interface PaymentDueOccurrence {
  intervalId: string;
  vehicleId: string;
  category: CostCategory;
  amount: number;
  intervalType: Exclude<IntervalType, null>;
  intervalDays: number;
  dueTs: number;
  daysUntilDue: number | null;
  daysOverdue: number | null;
  interval: VehicleCost;
}

export interface PaymentDueSummary {
  overdue: PaymentDueOccurrence[];
  upcoming: PaymentDueOccurrence[];
}

export interface PaymentDueOccurrences {
  overdue: PaymentDueOccurrence[];
  upcoming: PaymentDueOccurrence[];
}

function isPaymentInterval(entry: VehicleCost): boolean {
  return entry.kind === "interval" && entry.intervalType !== null;
}

function paymentIntervalDays(
  interval: Pick<VehicleCost, "intervalType" | "intervalDays">,
): number | null {
  if (interval.intervalType === "monthly") return 30;
  if (interval.intervalType === "yearly") return 365;
  if (interval.intervalType === "custom") {
    if (interval.intervalDays == null) return null;
    return Math.max(1, Math.floor(interval.intervalDays));
  }
  return null;
}

function buildPaymentDueKey(intervalId: string, dueTs: number): string {
  return `${intervalId}:${dueTs}`;
}

function buildPaidDueKeySet(historyEntries: VehicleCost[]): Set<string> {
  const set = new Set<string>();
  for (const entry of historyEntries) {
    if (!entry.paymentIntervalId || entry.intervalDueTs == null) continue;
    set.add(buildPaymentDueKey(entry.paymentIntervalId, entry.intervalDueTs));
  }
  return set;
}

function nextDueTsFromStep(interval: VehicleCost, step: number): number {
  const startTs = interval.dateTs;

  if (interval.intervalType === "monthly") {
    return startTs + step * 30 * DAY_MS;
  }

  if (interval.intervalType === "custom") {
    const days = paymentIntervalDays(interval) ?? 1;
    return startTs + step * days * DAY_MS;
  }

  const date = new Date(startTs);
  date.setFullYear(date.getFullYear() + step);
  return date.getTime();
}

function buildOccurrence(
  interval: VehicleCost,
  dueTs: number,
  nowTs: number,
): PaymentDueOccurrence {
  const intervalDays = paymentIntervalDays(interval) ?? 1;
  const overdueRaw = (nowTs - dueTs) / DAY_MS;

  if (dueTs < nowTs) {
    return {
      intervalId: interval.id,
      vehicleId: interval.vehicleId,
      category: interval.category,
      amount: interval.amount,
      intervalType: interval.intervalType as Exclude<IntervalType, null>,
      intervalDays,
      dueTs,
      daysUntilDue: null,
      daysOverdue: Math.max(1, Math.ceil(overdueRaw)),
      interval,
    };
  }

  return {
    intervalId: interval.id,
    vehicleId: interval.vehicleId,
    category: interval.category,
    amount: interval.amount,
    intervalType: interval.intervalType as Exclude<IntervalType, null>,
    intervalDays,
    dueTs,
    daysUntilDue: Math.max(0, Math.ceil((dueTs - nowTs) / DAY_MS)),
    daysOverdue: null,
    interval,
  };
}

export function computePaymentDueSummary(input: {
  intervals: VehicleCost[];
  historyEntries: VehicleCost[];
  nowTs?: number;
  horizonEndTs?: number;
}): PaymentDueSummary {
  const occurrences = computePaymentDueOccurrences(input);
  const nextByInterval = new Map<string, PaymentDueOccurrence>();

  for (const item of occurrences.upcoming) {
    const existing = nextByInterval.get(item.intervalId);
    if (!existing || item.dueTs < existing.dueTs) {
      nextByInterval.set(item.intervalId, item);
    }
  }

  const upcoming = [...nextByInterval.values()].sort((a, b) => a.dueTs - b.dueTs);

  return {
    overdue: occurrences.overdue,
    upcoming,
  };
}

export function computePaymentDueOccurrences(input: {
  intervals: VehicleCost[];
  historyEntries: VehicleCost[];
  nowTs?: number;
  horizonEndTs?: number;
}): PaymentDueOccurrences {
  const nowTs = input.nowTs ?? Date.now();
  const horizonEndTs = input.horizonEndTs ?? nowTs + 3650 * DAY_MS;
  const paidKeySet = buildPaidDueKeySet(input.historyEntries);

  const overdue: PaymentDueOccurrence[] = [];
  const upcoming: PaymentDueOccurrence[] = [];

  for (const interval of input.intervals) {
    if (!isPaymentInterval(interval)) continue;
    if (paymentIntervalDays(interval) == null) continue;

    for (let step = 1; step <= MAX_OCCURRENCES; step++) {
      const dueTs = nextDueTsFromStep(interval, step);

      const key = buildPaymentDueKey(interval.id, dueTs);
      if (paidKeySet.has(key)) {
        if (dueTs > horizonEndTs) break;
        continue;
      }

      const occurrence = buildOccurrence(interval, dueTs, nowTs);

      if (occurrence.daysOverdue != null) {
        overdue.push(occurrence);
      } else {
        upcoming.push(occurrence);
      }

      if (dueTs > horizonEndTs) break;
    }
  }

  overdue.sort((a, b) => {
    const left = a.daysOverdue ?? 0;
    const right = b.daysOverdue ?? 0;
    return right - left;
  });

  upcoming.sort((a, b) => a.dueTs - b.dueTs);

  return { overdue, upcoming };
}

export function pickBestUnpaidDueForPayment(input: {
  interval: VehicleCost;
  historyEntries: VehicleCost[];
  paymentDateTs: number;
  nowTs?: number;
}): number | null {
  const nowTs = input.nowTs ?? Date.now();
  if (!isPaymentInterval(input.interval)) return null;

  const intervalDays = paymentIntervalDays(input.interval);
  if (intervalDays == null) return null;

  const horizonEndTs = Math.max(
    nowTs + 3650 * DAY_MS,
    input.paymentDateTs + 3650 * DAY_MS,
  );

  const due = computePaymentDueSummary({
    intervals: [input.interval],
    historyEntries: input.historyEntries,
    nowTs,
    horizonEndTs,
  });

  const candidates = [...due.overdue, ...due.upcoming].filter(
    (item) => item.intervalId === input.interval.id,
  );

  if (!candidates.length) return null;

  const toleranceDays = Math.max(30, intervalDays * 2);
  const toleranceMs = toleranceDays * DAY_MS;

  candidates.sort((a, b) => {
    const da = Math.abs(a.dueTs - input.paymentDateTs);
    const db = Math.abs(b.dueTs - input.paymentDateTs);
    return da - db;
  });

  const nearest = candidates[0];
  if (Math.abs(nearest.dueTs - input.paymentDateTs) <= toleranceMs) {
    return nearest.dueTs;
  }

  const nearestOverdue = due.overdue.find(
    (item) => item.intervalId === input.interval.id,
  );
  if (nearestOverdue) return nearestOverdue.dueTs;

  const nearestUpcoming = due.upcoming.find(
    (item) => item.intervalId === input.interval.id,
  );
  return nearestUpcoming?.dueTs ?? null;
}
