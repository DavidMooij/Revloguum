export function formatOdometer(km: number): string {
  return km.toLocaleString('de-DE') + ' km';
}

export function formatCost(amount: number, currency = 'CHF'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatVehicleName(make: string, model: string, nickname?: string | null): string {
  if (nickname) return nickname;
  return `${make} ${model}`;
}

export function truncateNotes(notes: string | null, maxLength = 80): string {
  if (!notes) return '';
  if (notes.length <= maxLength) return notes;
  return notes.slice(0, maxLength).trimEnd() + '…';
}
