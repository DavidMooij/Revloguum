import type { TFunction } from "i18next";

type VehicleType = "car" | "motorcycle" | "other";

export function getVehicleFunFact(
  t: TFunction,
  vehicleType: VehicleType,
  odometerKm: number,
) {
  let mileageKey: "lowMileage" | "mediumMileage" | "highMileage";

  if (odometerKm < 10000) {
    mileageKey = "lowMileage";
  } else if (odometerKm < 100000) {
    mileageKey = "mediumMileage";
  } else {
    mileageKey = "highMileage";
  }

  const facts = t(`dashboard.funFacts.${vehicleType}.${mileageKey}`, {
    returnObjects: true,
  }) as string[];

  if (!facts?.length) return "";
  const day = Math.floor(Date.now() / 86_400_000);

  const index = (odometerKm + day) % facts.length;
  return facts[index];
}
