import type {
  ServiceEntry,
  ServiceEntryWithDetails,
  CreateServiceEntryInput,
  UpdateServiceEntryInput,
  ServiceEntryFilter,
} from '../entities/ServiceEntry';

export interface IServiceEntryRepo {
  getById(id: string): Promise<ServiceEntryWithDetails | null>;
  fetchFiltered(filter: ServiceEntryFilter): Promise<ServiceEntryWithDetails[]>;
  getLastForVehicle(vehicleId: string): Promise<ServiceEntry | null>;
  getLastByTypeForVehicle(vehicleId: string, serviceTypeId: string): Promise<ServiceEntry | null>;
  insert(input: CreateServiceEntryInput): Promise<ServiceEntry>;
  update(id: string, input: UpdateServiceEntryInput): Promise<void>;
  delete(id: string): Promise<void>;
  getTotalCostForVehicle(vehicleId: string): Promise<number>;
  getCountForVehicle(vehicleId: string): Promise<number>;
}
