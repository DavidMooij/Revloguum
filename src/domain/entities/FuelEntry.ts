export interface FuelEntry {
  id: string;
  vehicleId: string;
  dateTs: number;
  odometerKm: number;
  liters: number;
  cost: number;
  notes: string | null;
  createdAt: number;
}

export type CreateFuelEntryInput = Omit<FuelEntry, 'id' | 'createdAt'>;

export type UpdateFuelEntryInput = Partial<Omit<FuelEntry, 'id' | 'vehicleId' | 'createdAt'>>;

export interface FuelFilter {
  vehicleId?: string;
  dateFrom?: number;
  dateTo?: number;
  searchText?: string;
  notesOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface FuelStats {
  totalLiters: number;
  totalCost: number;
  avgCostPerLiter: number;
  avgConsumption: number;
  totalEntries: number;
}
