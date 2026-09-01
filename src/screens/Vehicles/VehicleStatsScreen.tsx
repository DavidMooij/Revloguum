import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { typography, typeScale } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import { formatCost } from "../../utils/format";
import ScreenHeader from "../components/ScreenHeader";
import LineChart from "./components/charts/LineChart";
import BarChart from "./components/charts/BarChart";
import DonutChart from "./components/charts/DonutChart";
import TyreAnalysisSection from "./components/stats/TyreAnalysisSection";
import { useVehicleStats } from "../../hooks/useVehicleStats";
import ExpandedChartModal, {
  type ExpandedChart,
} from "./components/stats/ExpandedChartModal";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleStats">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_W = SCREEN_WIDTH - spacing.lg * 4;

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
      label: t("stats.monthlyPaymentEstimate"),
      value: formatCost(monthlyPaymentEstimate),
      icon: "receipt",
    },
    { label: t("costs.serviceEntries"), value: String(count), icon: "wrench" },
  ];

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

        {paymentTypeCostData.length >= 1 && (
          <View style={styles.chartCard}>
            <View style={styles.chartCardHeader}>
              <View>
                <Text style={styles.sectionLabel}>
                  {t("stats.paymentTypeCostChart")}
                </Text>
                <Text style={styles.chartUnit}>CHF</Text>
              </View>
            </View>
            <DonutChart
              data={paymentTypeCostData}
              size={130}
              strokeWidth={16}
              centerLabel={formatCost(
                paymentTypeCostData.reduce((s, d) => s + d.value, 0),
              )}
              centerSub={t("stats.total")}
            />
          </View>
        )}

        {monthlyPaymentCostBarData.some((d) => d.value > 0) && (
          <ChartCard
            title={t("stats.monthlyPaymentCostChart")}
            unit="CHF"
            onExpand={() => setExpandedChart("monthlyPayments")}
          >
            <BarChart
              data={monthlyPaymentCostBarData}
              width={CHART_W}
              height={160}
              color={colors.warning}
              formatValue={(v) => v.toFixed(0)}
            />
          </ChartCard>
        )}

        {yearlyPaymentCostBarData.some((d) => d.value > 0) && (
          <ChartCard
            title={t("stats.yearlyPaymentCostChart")}
            unit="CHF"
            onExpand={() => setExpandedChart("yearlyPayments")}
          >
            <BarChart
              data={yearlyPaymentCostBarData}
              width={CHART_W}
              height={160}
              color={colors.success}
              formatValue={(v) => v.toFixed(0)}
            />
          </ChartCard>
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

      <ExpandedChartModal
        chart={expandedChart}
        onClose={() => setExpandedChart(null)}
        priceData={priceLineData}
        consumptionData={consumptionLineData}
        monthlyFuelData={monthlyFuelCostBarData}
        monthlyPaymentData={monthlyPaymentCostBarData}
        yearlyPaymentData={yearlyPaymentCostBarData}
        monthlyTotalData={monthlyTotalCostBarData}
        monthlyKmData={monthlyKmLineData}
      />
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
});
