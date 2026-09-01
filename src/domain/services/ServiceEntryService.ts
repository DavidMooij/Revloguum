import type { IServiceEntryRepo } from '../repositories/IServiceEntryRepo';
import type { IVehicleRepo } from '../repositories/IVehicleRepo';
import type { CreateServiceEntryInput, ServiceEntry } from '../entities/ServiceEntry';

export class ServiceEntryService {
  constructor(
    private entryRepo: IServiceEntryRepo,
    private motoRepo: IVehicleRepo,
  ) {}

  async addEntry(input: CreateServiceEntryInput): Promise<ServiceEntry> {
    const moto = await this.motoRepo.getById(input.vehicleId);
    if (!moto) throw new Error(`Vehicle ${input.vehicleId} not found`);

    if (input.odometerKm < 0) {
      throw new Error('Odometer value cannot be negative');
    }

    const entry = await this.entryRepo.insert(input);
    return entry;
  }

  async getPrefill(vehicleId: string): Promise<{
    odometerKm: number;
    dateTs: number;
  }> {
    const last = await this.entryRepo.getLastForVehicle(vehicleId);
    return {
      odometerKm: last ? last.odometerKm + 1 : 0,
      dateTs: Date.now(),
    };
  }
}
