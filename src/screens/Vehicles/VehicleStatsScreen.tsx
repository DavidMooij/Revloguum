import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
} from "react-native";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { getDatabase } from "../../data/db/database";
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import { SQLiteServiceEntryRepo } from "../../data/repositories/SQLiteServiceEntryRepo";
import { SQLiteFuelRepo } from "../../data/repositories/SQLiteFuelRepo";
import { SQLiteVehicleCostRepo } from "../../data/repositories/SQLiteVehicleCostRepo";
import { formatCost, formatOdometer } from "../../utils/format";
import { formatDateShort } from "../../utils/date";
import ScreenHeader from "../components/ScreenHeader";
import LineChart, { LineChartPoint } from "./components/charts/LineChart";
import BarChart, { BarChartData } from "./components/charts/BarChart";
import DonutChart from "./components/charts/DonutChart";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleStats">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_W = SCREEN_WIDTH - spacing.lg * 4;

export default function VehicleStatsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const [stats, setStats] = useState<any>(null);
  const [fuelEntries, setFuelEntries] = useState<any[]>([]);
  const [expandedChart, setExpandedChart] = useState<
    null | "price" | "consumption" | "monthly"
  >(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const db = await getDatabase();
        const moto = await new SQLiteVehicleRepo(db).getById(vehicleId);
        if (!moto) return;
        const fuelRepo = new SQLiteFuelRepo(db);
        const [count, serviceCost, fuelStats, otherCost, allFuel] =
          await Promise.all([
            new SQLiteServiceEntryRepo(db).getCountForVehicle(vehicleId),
            new SQLiteServiceEntryRepo(db).getTotalCostForVehicle(vehicleId),
            fuelRepo.getStats({ vehicleId }),
            new SQLiteVehicleCostRepo(db).getTotalCost(vehicleId),
            fuelRepo.fetchFiltered({ vehicleId, limit: 50 }),
          ]);
        setStats({ moto, count, serviceCost, fuelStats, otherCost });
        setFuelEntries(allFuel.reverse());
      })();
    }, [vehicleId]),
  );

  if (!stats) return null;

  const { moto, count, serviceCost, fuelStats, otherCost } = stats;
  const totalCost = serviceCost + fuelStats.totalCost + otherCost;
  const costPerKm =
    moto.currentOdometer > 0 ? totalCost / moto.currentOdometer : 0;

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

  const monthlyBarData: BarChartData[] = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const start = d.getTime();
      const end = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
      ).getTime();
      const total = fuelEntries
        .filter((e: any) => e.dateTs >= start && e.dateTs <= end)
        .reduce((sum: number, e: any) => sum + e.cost, 0);
      return {
        label: d.toLocaleString("de-CH", { month: "short" }),
        value: total,
        color: colors.accent,
      };
    });
  })();

  const donutData = [
    { label: t("stats.service"), value: serviceCost, color: colors.accent },
    {
      label: t("stats.fuel"),
      value: fuelStats.totalCost,
      color: colors.accentBright,
    },
    { label: t("stats.other"), value: otherCost, color: colors.bg4 },
  ].filter((d) => d.value > 0);

  const metrics = [
    {
      label: t("costs.costPerKm"),
      value: `CHF ${costPerKm.toFixed(2)}`,
      icon: "road",
    },
    {
      label: t("costs.lPer100km"),
      value: `${fuelStats.avgConsumption.toFixed(1)} L`,
      icon: "gas-pump",
    },
    {
      label: t("costs.avgPricePerL"),
      value: formatCost(fuelStats.avgCostPerLiter),
      icon: "tag",
    },
    {
      label: t("costs.totalLiters"),
      value: `${fuelStats.totalLiters.toFixed(0)} L`,
      icon: "tint",
    },
    {
      label: t("costs.odometer"),
      value: formatOdometer(moto.currentOdometer),
      icon: "tachometer-alt",
    },
    { label: t("costs.serviceEntries"), value: String(count), icon: "wrench" },
  ];

  const fullW = SCREEN_WIDTH - spacing.lg * 2;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title={t("stats.title")} showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.costSummaryCard}>
          <View style={styles.costSummaryHeader}>
            <Text style={styles.cardLabel}>{t("stats.totalCosts")}</Text>

            <Text style={styles.costPeriod}>{t("stats.allTime")}</Text>
          </View>

          <View style={styles.costOverview}>
            <DonutChart
              data={donutData}
              size={140}
              strokeWidth={18}
              centerLabel={formatCost(totalCost)}
              centerSub={t("stats.total")}
            />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.map((m, i) => (
            <View key={i} style={[styles.metricCard]}>
              <Icon name={m.icon as any} size={14} color={colors.accent} />
              <Text
                style={[styles.metricValue]}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.65}
              >
                {m.value}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={2}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        {priceLineData.length >= 2 && (
          <ChartCard
            title={t("stats.gasPriceChart")}
            unit="CHF/L"
            onExpand={() => setExpandedChart("price")}
          >
            <LineChart
              data={priceLineData}
              width={CHART_W}
              height={160}
              color={colors.accent}
              formatY={(v) => v.toFixed(2)}
            />
          </ChartCard>
        )}
        {consumptionLineData.length >= 2 && (
          <ChartCard
            title={t("stats.consumptionChart")}
            unit="L/100km"
            onExpand={() => setExpandedChart("consumption")}
          >
            <LineChart
              data={consumptionLineData}
              width={CHART_W}
              height={160}
              color={colors.accentBright}
              formatY={(v) => v.toFixed(1)}
            />
          </ChartCard>
        )}
        {monthlyBarData.some((d) => d.value > 0) && (
          <ChartCard
            title={t("stats.fuelCostChart")}
            unit="CHF"
            onExpand={() => setExpandedChart("monthly")}
          >
            <BarChart
              data={monthlyBarData}
              width={CHART_W}
              height={160}
              color={colors.accent}
              formatValue={(v) => v.toFixed(0)}
            />
          </ChartCard>
        )}
      </ScrollView>

      <Modal
        visible={!!expandedChart}
        animationType="slide"
        statusBarTranslucent
      >
        <SafeAreaView style={styles.fullscreenModal}>
          <View style={styles.fullscreenHeader}>
            <View>
              <Text style={styles.fullscreenTitle}>
                {expandedChart === "price"
                  ? t("stats.gasPriceChart")
                  : expandedChart === "consumption"
                    ? t("stats.consumptionChart")
                    : t("stats.fuelCostChart")}
              </Text>

              <Text style={styles.fullscreenSubtitle}>
                {expandedChart === "price"
                  ? "CHF/L"
                  : expandedChart === "consumption"
                    ? "L/100km"
                    : "CHF"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setExpandedChart(null)}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <Icon name="times" size={16} color={colors.text1} />
            </TouchableOpacity>
          </View>

          <View style={styles.fullscreenChartArea}>
            {expandedChart === "price" && priceLineData.length >= 2 && (
              <LineChart
                data={priceLineData}
                width={SCREEN_WIDTH - spacing.lg * 2}
                height={420}
                color={colors.accent}
                unit="CHF/L"
                formatY={(v) => v.toFixed(2)}
                showDots
              />
            )}

            {expandedChart === "consumption" &&
              consumptionLineData.length >= 2 && (
                <LineChart
                  data={consumptionLineData}
                  width={SCREEN_WIDTH - spacing.lg * 2}
                  height={420}
                  color={colors.accentBright}
                  unit="L/100km"
                  formatY={(v) => v.toFixed(1)}
                  showDots
                />
              )}

            {expandedChart === "monthly" && (
              <BarChart
                data={monthlyBarData}
                width={SCREEN_WIDTH - spacing.lg * 2}
                height={420}
                color={colors.accent}
                formatValue={(v) => v.toFixed(0)}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function ChartCard({
  title,
  unit,
  children,
  onExpand,
}: {
  title: string;
  unit?: string;
  children: React.ReactNode;
  onExpand: () => void;
}) {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartCardHeader}>
        <View>
          <Text style={styles.sectionLabel}>{title}</Text>
          {unit && <Text style={styles.chartUnit}>{unit}</Text>}
        </View>
        <TouchableOpacity
          onPress={onExpand}
          hitSlop={16}
          style={styles.expandBtn}
        >
          <Icon name="expand-alt" size={13} color={colors.text2} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, paddingBottom: 60, gap: spacing.lg },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  costSummaryCard: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: spacing.md,
  },

  costSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  costPeriod: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  costOverview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  costBreakdown: {
    flex: 1,
    gap: spacing.sm,
  },

  costBreakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  costText: {
    flex: 1,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  legendLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text1,
  },

  legendValue: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 1,
  },

  legendPct: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text0,
  },

  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3,
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.sm + 2,
    gap: 4,
    alignItems: "flex-start",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text0,
    letterSpacing: -0.3,
  },
  metricLabel: { fontSize: 10, color: colors.text2, lineHeight: 13 },

  chartCard: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chartCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  chartUnit: { fontSize: 10, color: colors.text2, marginTop: 1 },
  expandBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.bg2,
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenModal: { flex: 1, backgroundColor: colors.bg0 },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
  },
  fullscreenSubtitle: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 2,
  },

  fullscreenChartArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  fullscreenTitle: { fontSize: 16, fontWeight: "700", color: colors.text0 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg2,
    alignItems: "center",
    justifyContent: "center",
  }
});
