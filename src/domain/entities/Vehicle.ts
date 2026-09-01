export type VehicleType = 'motorcycle' | 'car' | 'other';

export interface ServiceInterval {
  serviceTypeId: string;
  intervalKm?: number;
  intervalDays?: number;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  nickname: string | null;
  currentOdometer: number;
  baseOdometer: number;
  vehicleType: VehicleType;
  photoPath: string | null;
  defaultTankLiters: number | null;
  defaultFuelPrice: number | null;
  serviceIntervals: ServiceInterval[];
  createdAt: number;
  updatedAt: number;
}

export type CreateVehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateVehicleInput = Partial<CreateVehicleInput>;
