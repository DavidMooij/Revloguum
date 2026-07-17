import { useAppStore } from '../store/appStore';
import { useVehicles } from './useVehicles';

export function useActiveVehicle() {
  const { activeVehicleId, setActiveVehicleId, getActiveVehicle } = useAppStore();
  const { vehicles } = useVehicles();

  return {
    activeVehicle: getActiveVehicle(),
    activeVehicleId,
    setActiveVehicleId,
    hasVehicles: vehicles.length > 0,
  };
}
