import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { getDatabase } from "../data/db/database";
import { SQLiteVehicleRepo } from "../data/repositories/SQLiteVehicleRepo";
import { SQLiteFuelRepo } from "../data/repositories/SQLiteFuelRepo";
import { SQLiteServiceEntryRepo } from "../data/repositories/SQLiteServiceEntryRepo";
import { SQLiteVehicleCostRepo } from "../data/repositories/SQLiteVehicleCostRepo";
import type { LineChartPoint } from "../screens/Vehicles/components/charts/LineChart";
import type { BarChartData } from "../screens/Vehicles/components/charts/BarChart";
import type { DonutSegment } from "../screens/Vehicles/components/charts/DonutChart";
import { formatDateShort } from "../utils/date";
import { colors } from "../theme/colors";
import { ServiceTypeLabelService } from "../domain/services/ServiceTypeLabelService";

const DONUT_OTHER_CATEGORIES = new Set([
  "purchase",
  "tax",
  "parking",
  "accessory",
  "gear",
  "other",
]);

const SERVICE_TYPE_PALETTE = [
  colors.accent,
  colors.accentBright,
  colors.success,
  colors.warning,
  colors.danger,
  "#60A5FA",
  "#F472B6",
  "#34D399",
];

function buildMonthlyData(
  fuelEntries: any[],
  serviceEntries: { dateTs: number; cost: number | null }[],
  vehicleCostEntries: { dateTs: number; amount: number }[],
  monthCount: number,
): BarChartData[] {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();

    const fuelCost = fuelEntries
      .filter((e) => e.dateTs >= start && e.dateTs <= end)
      .reduce((sum: number, e: any) => sum + e.cost, 0);
    const serviceCost = serviceEntries
      .filter((e) => e.dateTs >= start && e.dateTs <= end)
      .reduce((sum, e) => sum + (e.cost ?? 0), 0);
    const otherCost = vehicleCostEntries
      .filter((e) => e.dateTs >= start && e.dateTs <= end)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      label: d.toLocaleString("de-CH", { month: "short" }),
      value: fuelCost + serviceCost + otherCost,
      color: colors.accent,
    };
  });
}

function buildMonthlyKmData(fuelEntries: any[], monthCount: number): LineChartPoint[] {
  if (fuelEntries.length === 0) return [];

  const now = new Date();
  const months = Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
    return {
      d,
      start: d.getTime(),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime(),
    };
  });

  const lastOdoPerMonth = months.map(({ start, end }) => {
    const inMonth = fuelEntries.filter((e) => e.dateTs >= start && e.dateTs <= end);
    if (inMonth.length === 0) return null;
    return Math.max(...inMonth.map((e: any) => e.odometerKm));
  });

  const points: LineChartPoint[] = [];
  for (let i = 1; i < months.length; i++) {
    const curr = lastOdoPerMonth[i];
    if (curr === null) continue;
    let prev: number | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (lastOdoPerMonth[j] !== null) { prev = lastOdoPerMonth[j]; break; }
    }
    if (prev === null) continue;
    const km = curr - prev;
    if (km <= 0) continue;
    points.push({
      x: months[i].d.getTime(),
      y: km,
      label: months[i].d.toLocaleString("de-CH", { month: "short" }),
    });
  }
  return points;
}

export interface VehicleStatsData {
  moto: any;
  count: number;
  serviceCost: number;
  fuelStats: any;
  otherCost: number;
  totalCost: number;
  costPerKm: number;
  costDonutData: DonutSegment[];
  serviceTypeCostData: DonutSegment[];
  priceLineData: LineChartPoint[];
  consumptionLineData: LineChartPoint[];
  monthlyFuelCostBarData: BarChartData[];
  monthlyTotalCostBarData: BarChartData[];
  monthlyKmLineData: LineChartPoint[];
}

export function useVehicleStats(vehicleId: string): VehicleStatsData | null {
  const { t } = useTranslation();
  const [data, setData] = useState<VehicleStatsData | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const db = await getDatabase();
        const vehicleRepo = new SQLiteVehicleRepo(db);
        const fuelRepo = new SQLiteFuelRepo(db);
        const serviceRepo = new SQLiteServiceEntryRepo(db);
        const costRepo = new SQLiteVehicleCostRepo(db);

        const moto = await vehicleRepo.getById(vehicleId);
        if (!moto) return;

        const [
          count,
          serviceCost,
          fuelStats,
          otherCost,
          allFuel,
          costsByCategory,
          serviceTypeCosts,
          allServiceDates,
          allVehicleCostDates,
        ] = await Promise.all([
          serviceRepo.getCountForVehicle(vehicleId),
          serviceRepo.getTotalCostForVehicle(vehicleId),
          fuelRepo.getStats({ vehicleId }),
          costRepo.getTotalCost(vehicleId),
          fuelRepo.fetchFiltered({ vehicleId, limit: 500 }),
          costRepo.getCostsByCategory(vehicleId),
          serviceRepo.getCostByServiceType(vehicleId),
          serviceRepo.getAllWithDates(vehicleId),
          costRepo.getAllWithDates(vehicleId),
        ]);

        const fuelEntries = [...allFuel].reverse();
        const totalCost = serviceCost + fuelStats.totalCost + otherCost;
        const costPerKm = moto.currentOdometer > 0 ? totalCost / moto.currentOdometer : 0;

        const insuranceCost = costsByCategory.find((c) => c.category === "insurance")?.total ?? 0;
        const maintenanceCost = costsByCategory.find((c) => c.category === "maintenance")?.total ?? 0;
        const otherVehicleCost = costsByCategory
          .filter((c) => DONUT_OTHER_CATEGORIES.has(c.category))
          .reduce((sum, c) => sum + c.total, 0);

        const costDonutData: DonutSegment[] = [
          { label: "stats.service", value: serviceCost, color: colors.accent },
          { label: "stats.fuel", value: fuelStats.totalCost, color: colors.accentBright },
          { label: "stats.insurance", value: insuranceCost, color: colors.warning },
          { label: "stats.maintenance", value: maintenanceCost, color: colors.success },
          { label: "stats.other", value: otherVehicleCost, color: colors.bg4 },
        ].filter((d) => d.value > 0);

        const serviceTypeCostData: DonutSegment[] = serviceTypeCosts
          .filter((s) => s.total > 0)
          .map((s, i) => ({
            label: ServiceTypeLabelService.getLabel(s, t),
            value: s.total,
            color: SERVICE_TYPE_PALETTE[i % SERVICE_TYPE_PALETTE.length],
          }));

        const priceLineData: LineChartPoint[] = fuelEntries
          .filter((e: any) => e.liters > 0)
          .map((e: any) => ({
            x: e.dateTs,
            y: parseFloat((e.cost / e.liters).toFixed(3)),
            label: formatDateShort(e.dateTs),
          }));

        const consumptionLineData: LineChartPoint[] = fuelEntries
          .slice(1)
          .map((e: any, i: number) => {
            const prev = fuelEntries[i];
            const km = e.odometerKm - prev.odometerKm;
            if (km <= 0) return null;
            return {
              x: e.dateTs,
              y: parseFloat(((e.liters / km) * 100).toFixed(2)),
              label: formatDateShort(e.dateTs),
            };
          })
          .filter(Boolean) as LineChartPoint[];

        const monthlyFuelCostBarData: BarChartData[] = Array.from({ length: 6 }, (_, i) => {
          const now2 = new Date();
          const d = new Date(now2.getFullYear(), now2.getMonth() - (5 - i), 1);
          const start = d.getTime();
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
          const total = fuelEntries
            .filter((e: any) => e.dateTs >= start && e.dateTs <= end)
            .reduce((sum: number, e: any) => sum + e.cost, 0);
          return {
            label: d.toLocaleString("de-CH", { month: "short" }),
            value: total,
            color: colors.accentBright,
          };
        });

        const monthlyTotalCostBarData = buildMonthlyData(
          fuelEntries,
          allServiceDates,
          allVehicleCostDates,
          6,
        );

        const monthlyKmLineData = buildMonthlyKmData(fuelEntries, 6);

        setData({
          moto,
          count,
          serviceCost,
          fuelStats,
          otherCost,
          totalCost,
          costPerKm,
          costDonutData,
          serviceTypeCostData,
          priceLineData,
          consumptionLineData,
          monthlyFuelCostBarData,
          monthlyTotalCostBarData,
          monthlyKmLineData,
        });
      })();
    }, [vehicleId]),
  );

  return data;
}
