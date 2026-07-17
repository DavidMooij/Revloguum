import type { ServiceEntryWithDetails, ServiceEntryFilter } from '../entities/ServiceEntry';

export class FilterEngine {
  static apply(
    entries: ServiceEntryWithDetails[],
    filter: ServiceEntryFilter,
  ): ServiceEntryWithDetails[] {
    let result = entries;

    if (filter.vehicleId) {
      result = result.filter(e => e.vehicleId === filter.vehicleId);
    }

    if (filter.serviceTypeIds && filter.serviceTypeIds.length > 0) {
      const ids = new Set(filter.serviceTypeIds);
      result = result.filter(e => ids.has(e.serviceTypeId));
    }

    if (filter.dateFrom !== undefined) {
      result = result.filter(e => e.dateTs >= filter.dateFrom!);
    }

    if (filter.dateTo !== undefined) {
      result = result.filter(e => e.dateTs <= filter.dateTo!);
    }

    if (filter.odometerMin !== undefined) {
      result = result.filter(e => e.odometerKm >= filter.odometerMin!);
    }

    if (filter.odometerMax !== undefined) {
      result = result.filter(e => e.odometerKm <= filter.odometerMax!);
    }

    if (filter.searchText?.trim()) {
      const q = filter.searchText.trim().toLowerCase();
      result = result.filter(
        e =>
          e.serviceTypeName.toLowerCase().includes(q) ||
          (e.notes?.toLowerCase().includes(q) ?? false),
      );
    }

    return result;
  }

  static sortByDateDesc(entries: ServiceEntryWithDetails[]): ServiceEntryWithDetails[] {
    return [...entries].sort((a, b) => b.dateTs - a.dateTs || b.odometerKm - a.odometerKm);
  }
}
