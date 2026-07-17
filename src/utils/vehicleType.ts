import type { VehicleType } from '../domain/entities/Vehicle';

export function vehicleTypeIcon(type: VehicleType | undefined): string {
  switch (type) {
    case 'car':
      return 'car';
    case 'other':
      return 'truck';
    case 'motorcycle':
    default:
      return 'motorcycle';
  }
}
