import React, { useState } from "react";
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
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { typography, typeScale } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import { formatCost, formatOdometer } from "../../utils/format";
import ScreenHeader from "../components/ScreenHeader";
import LineChart from "./components/charts/LineChart";
import BarChart from "./components/charts/BarChart";
import DonutChart from "./components/charts/DonutChart";
import TyreAnalysisSection from "./components/stats/TyreAnalysisSection";
import { useVehicleStats } from "../../hooks/useVehicleStats";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleStats">;

type ExpandedChart =
  | "price"
  | "consumption"
  | "monthlyFuel"
  | "monthlyTotal"
  | "monthlyKm"
  | null;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_W = SCREEN_WIDTH - spacing.lg * 4;
const CHART_W_FULL = SCREEN_WIDTH - spacing.lg * 2;

export default function VehicleStatsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const stats = useVehicleStats(vehicleId);
  const [expandedChart, setExpandedChart] = useState<ExpandedChart>(null);

  if (!stats) return null;

  const {
    moto,
    count,
    fuelStats,
    costPerKm,
    costDonutData,
    serviceTypeCostData,
    priceLineData,
    consumptionLineData,
    monthlyFuelCostBarData,
    monthlyTotalCostBarData,
    monthlyKmLineData,
    tyreData,
  } = stats;

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

  const expandedChartTitle = (() => {
    switch (expandedChart) {
      case "price":
        return t("stats.gasPriceChart");
      case "consumption":
        return t("stats.consumptionChart");
      case "monthlyFuel":
        return t("stats.fuelCostChart");
      case "monthlyTotal":
        return t("stats.monthlyTotalCostChart");
      case "monthlyKm":
        return t("stats.monthlyKmChart");
      default:
        return "";
    }
  })();

  const expandedChartUnit = (() => {
    switch (expandedChart) {
      case "price":
        return "CHF/L";
      case "consumption":
        return "L/100km";
      case "monthlyFuel":
      case "monthlyTotal":
        return "CHF";
      case "monthlyKm":
        return t("stats.km");
      default:
        return "";
    }
  })();

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
              data={costDonutData.map((d) => ({ ...d, label: t(d.label) }))}
              size={140}
              strokeWidth={18}
              centerLabel={formatCost(stats.totalCost)}
              centerSub={t("stats.total")}
            />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.map((m, i) => (
            <View key={i} style={styles.metricCard}>
              <Icon name={m.icon as any} size={14} color={colors.accent} />
              <Text
                style={styles.metricValue}
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

        {monthlyFuelCostBarData.some((d) => d.value > 0) && (
          <ChartCard
            title={t("stats.fuelCostChart")}
            unit="CHF"
            onExpand={() => setExpandedChart("monthlyFuel")}
          >
            <BarChart
              data={monthlyFuelCostBarData}
              width={CHART_W}
              height={160}
              color={colors.accentBright}
              formatValue={(v) => v.toFixed(0)}
            />
          </ChartCard>
        )}

        {monthlyKmLineData.length >= 2 && (
          <ChartCard
            title={t("stats.monthlyKmChart")}
            unit={t("stats.km")}
            onExpand={() => setExpandedChart("monthlyKm")}
          >
            <LineChart
              data={monthlyKmLineData}
              width={CHART_W}
              height={160}
              color={colors.success}
              formatY={(v) => v.toFixed(0)}
            />
          </ChartCard>
        )}

        {serviceTypeCostData.length >= 2 && (
          <View style={styles.chartCard}>
            <View style={styles.chartCardHeader}>
              <View>
                <Text style={styles.sectionLabel}>
                  {t("stats.serviceTypeCostChart")}
                </Text>
                <Text style={styles.chartUnit}>CHF</Text>
              </View>
            </View>
            <DonutChart
              data={serviceTypeCostData}
              size={130}
              strokeWidth={16}
              centerLabel={formatCost(
                serviceTypeCostData.reduce((s, d) => s + d.value, 0),
              )}
              centerSub={t("stats.total")}
            />
          </View>
        )}

        {monthlyTotalCostBarData.some((d) => d.value > 0) && (
          <ChartCard
            title={t("stats.monthlyTotalCostChart")}
            unit="CHF"
            onExpand={() => setExpandedChart("monthlyTotal")}
          >
            <BarChart
              data={monthlyTotalCostBarData}
              width={CHART_W}
              height={160}
              color={colors.accent}
              formatValue={(v) => v.toFixed(0)}
            />
          </ChartCard>
        )}

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

        {tyreData.length >= 1 && <TyreAnalysisSection data={tyreData} />}
      </ScrollView>

      <Modal
        visible={!!expandedChart}
        animationType="slide"
        statusBarTranslucent
      >
        <SafeAreaView style={styles.fullscreenModal}>
          <View style={styles.fullscreenHeader}>
            <View>
              <Text style={styles.fullscreenTitle}>{expandedChartTitle}</Text>
              <Text style={styles.fullscreenSubtitle}>{expandedChartUnit}</Text>
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
                width={CHART_W_FULL}
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
                  width={CHART_W_FULL}
                  height={420}
                  color={colors.accentBright}
                  unit="L/100km"
                  formatY={(v) => v.toFixed(1)}
                  showDots
                />
              )}
            {expandedChart === "monthlyFuel" && (
              <BarChart
                data={monthlyFuelCostBarData}
                width={CHART_W_FULL}
                height={420}
                color={colors.accentBright}
                formatValue={(v) => v.toFixed(0)}
              />
            )}
            {expandedChart === "monthlyTotal" && (
              <BarChart
                data={monthlyTotalCostBarData}
                width={CHART_W_FULL}
                height={420}
                color={colors.accent}
                formatValue={(v) => v.toFixed(0)}
              />
            )}
            {expandedChart === "monthlyKm" && monthlyKmLineData.length >= 2 && (
              <LineChart
                data={monthlyKmLineData}
                width={CHART_W_FULL}
                height={420}
                color={colors.success}
                unit={t("stats.km")}
                formatY={(v) => v.toFixed(0)}
                showDots
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
    ...typography.overline,
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
    ...typography.overline,
  },
  costPeriod: {
    ...typography.overline,
  },
  costOverview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
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
    ...typography.bodyStrong,
    color: colors.text0,
  },
  metricLabel: { fontSize: typeScale.overline, color: colors.text2, lineHeight: 13 },
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
  chartUnit: { fontSize: typeScale.overline, color: colors.text2, marginTop: 1 },
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
  fullscreenSubtitle: { fontSize: typeScale.caption, color: colors.text2, marginTop: 2 },
  fullscreenChartArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  fullscreenTitle: { ...typography.buttonLarge, fontWeight: "700", color: colors.text0 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg2,
    alignItems: "center",
    justifyContent: "center",
  },
});
