import { format, formatDistanceToNow, subDays, subYears } from 'date-fns';

export function todayTs(): number {
  return Date.now();
}

export function formatDate(ts: number): string {
  return format(new Date(ts), 'dd MMM yyyy');
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
