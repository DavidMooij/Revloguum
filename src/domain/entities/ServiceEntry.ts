export interface ServiceEntry {
  id: string;
  vehicleId: string;
  serviceTypeId: string;
  dateTs: number;
  odometerKm: number;
  cost: number | null;
  notes: string | null;
  imagePaths: string[]; 
  createdAt: number;
  updatedAt: number;
}

export interface ServiceEntryWithDetails extends ServiceEntry {
  serviceTypeName: string;
  serviceTypeIcon: string;
  vehicleDisplayName: string;
}

export type CreateServiceEntryInput = Omit<ServiceEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateServiceEntryInput = Partial<Omit<ServiceEntry, 'id' | 'vehicleId' | 'createdAt' | 'updatedAt'>>;

export interface ServiceEntryFilter {
  vehicleId?: string;
  serviceTypeIds?: string[];
  dateFrom?: number;
  dateTo?: number;
  odometerMin?: number;
  odometerMax?: number;
  searchText?: string;
  limit?: number;
  offset?: number;
}
