import type { ServiceType, CreateServiceTypeInput } from '../entities/ServiceType';

export interface IServiceTypeRepo {
  getAll(): Promise<ServiceType[]>;
  getById(id: string): Promise<ServiceType | null>;
  insert(input: CreateServiceTypeInput): Promise<ServiceType>;
  update(id: string, name: string, icon: string): Promise<void>;
  delete(id: string): Promise<void>;
}
