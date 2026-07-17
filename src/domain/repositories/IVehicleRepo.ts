import type { Vehicle, CreateVehicleInput, UpdateVehicleInput } from '../entities/Vehicle';

export interface IVehicleRepo {
  getAll(): Promise<Vehicle[]>;
  getById(id: string): Promise<Vehicle | null>;
  insert(input: CreateVehicleInput): Promise<Vehicle>;
  update(id: string, input: UpdateVehicleInput): Promise<Vehicle | null>;
  delete(id: string): Promise<void>;
  updateOdometer(id: string, odometer: number): Promise<void>;
}
