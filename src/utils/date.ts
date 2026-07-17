import { format, formatDistanceToNow, startOfDay, endOfDay, subDays, subMonths, subYears } from 'date-fns';

export function tsToDate(ts: number): Date {
  return new Date(ts);
}

export function dateToTs(date: Date): number {
  return date.getTime();
}

export function todayTs(): number {
  return Date.now();
}

export function startOfDayTs(ts: number): number {
  return startOfDay(new Date(ts)).getTime();
}

export function endOfDayTs(ts: number): number {
  return endOfDay(new Date(ts)).getTime();
}

export function formatDate(ts: number): string {
  return format(new Date(ts), 'dd MMM yyyy');
}

export function formatDateShort(ts: number): string {
  return format(new Date(ts), 'dd MMM');
}

export function formatDateRelative(ts: number): string {
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

export function formatDateTime(ts: number): string {
  return format(new Date(ts), 'dd MMM yyyy, HH:mm');
}

export type DateRangePreset = 'last30' | 'last90' | 'last365' | 'all';

export function dateRangeFromPreset(preset: DateRangePreset): { from?: number; to?: number } {
  const now = Date.now();
  switch (preset) {
    case 'last30':  return { from: subDays(now, 30).getTime(),   to: now };
    case 'last90':  return { from: subDays(now, 90).getTime(),   to: now };
    case 'last365': return { from: subYears(now, 1).getTime(),   to: now };
    case 'all':     return {};
  }
}
