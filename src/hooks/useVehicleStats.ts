import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { getDatabase } from "../data/db/database";
import { SQLiteVehicleRepo } from "../data/repositories/SQLiteVehicleRepo";
import { SQLiteFuelRepo } from "../data/repositories/SQLiteFuelRepo";
import { SQLiteServiceEntryRepo } from "../data/repositories/SQLiteServiceEntryRepo";
import { SQLiteVehicleCostRepo } from "../data/repositories/SQLiteVehicleCostRepo";
import { SQLitePaymentTypeRepo } from "../data/repositories/SQLitePaymentTypeRepo";
import type { LineChartPoint } from "../screens/Vehicles/components/charts/LineChart";
import type { BarChartData } from "../screens/Vehicles/components/charts/BarChart";
import type { DonutSegment } from "../screens/Vehicles/components/charts/DonutChart";
import { colors } from "../theme/colors";
import { ServiceTypeLabelService } from "../domain/services/ServiceTypeLabelService";
import { PaymentTypeLabelService } from "@/domain/services/PaymentTypeLabelService";

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

const PAYMENT_CATEGORY_PALETTE: string[] = [
  colors.accent,
  colors.warning,
  colors.success,
  "#60A5FA",
  "#F472B6",
  "#34D399",
  colors.accentBright,
  colors.bg4,
];

function colorForPaymentCategory(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return PAYMENT_CATEGORY_PALETTE[hash % PAYMENT_CATEGORY_PALETTE.length];
}

function buildMonthlyData(
  fuelEntries: any[],
  serviceEntries: { dateTs: number; cost: number | null }[],
  vehicleCostEntries: { dateTs: number; amount: number }[],
  monthCount: number,
  locale: string,
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
      label: d.toLocaleString(locale, { month: "short" }),
      value: fuelCost + serviceCost + otherCost,
      color: colors.accent,
    };
  });
}

function buildMonthlyKmData(
  fuelEntries: any[],
  monthCount: number,
  locale: string,
): LineChartPoint[] {
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
      label: months[i].d.toLocaleString(locale, { month: "short" }),
    });
  }
  return points;
}

function buildMonthlyPaymentCostData(
  paymentEntries: { dateTs: number; amount: number }[],
  monthCount: number,
  locale: string,
): BarChartData[] {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();

    const total = paymentEntries
      .filter((e) => e.dateTs >= start && e.dateTs <= end)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      label: d.toLocaleString(locale, { month: "short" }),
      value: total,
      color: colors.warning,
    };
  });
}

function buildYearlyPaymentCostData(
  paymentEntries: { dateTs: number; amount: number }[],
  yearCount: number,
): BarChartData[] {
  const now = new Date();
  return Array.from({ length: yearCount }, (_, i) => {
    const year = now.getFullYear() - (yearCount - 1 - i);
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year, 11, 31, 23, 59, 59).getTime();

    const total = paymentEntries
      .filter((e) => e.dateTs >= start && e.dateTs <= end)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      label: String(year),
      value: total,
      color: colors.success,
    };
  });
}

export interface TyreDataPoint {
  dateTs: number;
  odometerKm: number;
  kmSincePrev: number | null;
  notes: string | null;
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
  paymentTypeCostData: DonutSegment[];
  monthlyPaymentCostBarData: BarChartData[];
  yearlyPaymentCostBarData: BarChartData[];
  monthlyPaymentEstimate: number;
  serviceTypeCostData: DonutSegment[];
  priceLineData: LineChartPoint[];
  consumptionLineData: LineChartPoint[];
  monthlyFuelCostBarData: BarChartData[];
  monthlyTotalCostBarData: BarChartData[];
  monthlyKmLineData: LineChartPoint[];
  tyreData: TyreDataPoint[];
}

export function useVehicleStats(vehicleId: string): VehicleStatsData | null {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<VehicleStatsData | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const db = await getDatabase();
        const vehicleRepo = new SQLiteVehicleRepo(db);
        const fuelRepo = new SQLiteFuelRepo(db);
        const serviceRepo = new SQLiteServiceEntryRepo(db);
        const costRepo = new SQLiteVehicleCostRepo(db);
        const paymentTypeRepo = new SQLitePaymentTypeRepo(db);

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
          paymentIntervals,
          tyreEntries,
          paymentTypes,
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
          costRepo.getIntervals(vehicleId),
          serviceRepo.getAllByTypeForVehicle(vehicleId, "sys_tyre"),
          paymentTypeRepo.getAll(),
        ]);

        const paymentTypeById = new Map(paymentTypes.map((pt) => [pt.id, pt]));

        const fuelEntries = [...allFuel].reverse();
        const totalCost = serviceCost + fuelStats.totalCost + otherCost;
        const costPerKm = moto.currentOdometer > 0 ? totalCost / moto.currentOdometer : 0;

        const insuranceCost = costsByCategory.find((c) => c.category === "insurance")?.total ?? 0;
        const maintenanceCost = costsByCategory.find((c) => c.category === "maintenance")?.total ?? 0;
        const otherVehicleCost = costsByCategory
          .filter((c) => c.category !== "insurance" && c.category !== "maintenance")
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

        const paymentTypeCostData: DonutSegment[] = costsByCategory
          .filter((c) => c.total > 0)
          .map((c) => {
            const paymentType = paymentTypeById.get(c.category);

            return {
              label: paymentType
                ? PaymentTypeLabelService.getLabel(paymentType, t)
                : (() => {
                    const key = `costs.categories.${c.category}`;
                    const translated = t(key);
                    return translated === key ? c.category : translated;
                  })(),
              value: c.total,
              color: colorForPaymentCategory(c.category),
            };
          });

        const priceLineData: LineChartPoint[] = fuelEntries
          .filter((e: any) => e.liters > 0)
          .map((e: any) => ({
            x: e.dateTs,
            y: parseFloat((e.cost / e.liters).toFixed(3)),
            label: new Date(e.dateTs).toLocaleDateString(i18n.language, {
              day: "2-digit",
              month: "short",
            }),
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
              label: new Date(e.dateTs).toLocaleDateString(i18n.language, {
                day: "2-digit",
                month: "short",
              }),
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
            label: d.toLocaleString(i18n.language, { month: "short" }),
            value: total,
            color: colors.accentBright,
          };
        });

        const monthlyTotalCostBarData = buildMonthlyData(
          fuelEntries,
          allServiceDates,
          allVehicleCostDates,
          6,
          i18n.language,
        );

        const monthlyPaymentCostBarData = buildMonthlyPaymentCostData(
          allVehicleCostDates,
          6,
          i18n.language,
        );

        const yearlyPaymentCostBarData = buildYearlyPaymentCostData(
          allVehicleCostDates,
          5,
        );

        const monthlyPaymentEstimate = paymentIntervals.reduce((sum, interval) => {
          if (interval.intervalType === "monthly") return sum + interval.amount;
          if (interval.intervalType === "yearly") return sum + interval.amount / 12;
          if (interval.intervalType === "custom" && interval.intervalDays) {
            return sum + (interval.amount * 30) / interval.intervalDays;
          }
          return sum;
        }, 0);

        const monthlyKmLineData = buildMonthlyKmData(
          fuelEntries,
          6,
          i18n.language,
        );

        const tyreData: TyreDataPoint[] = tyreEntries.map((e, i) => ({
          dateTs: e.dateTs,
          odometerKm: e.odometerKm,
          kmSincePrev: i > 0 ? e.odometerKm - tyreEntries[i - 1].odometerKm : null,
          notes: e.notes,
        }));

        setData({
          moto,
          count,
          serviceCost,
          fuelStats,
          otherCost,
          totalCost,
          costPerKm,
          costDonutData,
          paymentTypeCostData,
          monthlyPaymentCostBarData,
          yearlyPaymentCostBarData,
          monthlyPaymentEstimate,
          serviceTypeCostData,
          priceLineData,
          consumptionLineData,
          monthlyFuelCostBarData,
          monthlyTotalCostBarData,
          monthlyKmLineData,
          tyreData,
        });
      })();
    }, [vehicleId, i18n.language, t]),
  );

  return data;
}
