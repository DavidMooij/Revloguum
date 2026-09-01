import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../../theme/colors";
import { radius, spacing } from "../../../../theme/spacing";
import { typography, typeScale } from "../../../../theme/typography";
import type { BarChartData } from "../charts/BarChart";
import BarChart from "../charts/BarChart";
import type { LineChartPoint } from "../charts/LineChart";
import LineChart from "../charts/LineChart";

export type ExpandedChart =
  | "price"
  | "consumption"
  | "monthlyFuel"
  | "monthlyPayments"
  | "yearlyPayments"
  | "monthlyTotal"
  | "monthlyKm"
  | null;

interface Props {
  chart: ExpandedChart;
  onClose: () => void;
  priceData: LineChartPoint[];
  consumptionData: LineChartPoint[];
  monthlyFuelData: BarChartData[];
  monthlyPaymentData: BarChartData[];
  yearlyPaymentData: BarChartData[];
  monthlyTotalData: BarChartData[];
  monthlyKmData: LineChartPoint[];
}

const CHART_WIDTH = Dimensions.get("window").width - spacing.lg * 2;

export default function ExpandedChartModal({
  chart,
  onClose,
  priceData,
  consumptionData,
  monthlyFuelData,
  monthlyPaymentData,
  yearlyPaymentData,
  monthlyTotalData,
  monthlyKmData,
}: Props) {
  const { t } = useTranslation();

  const details = getChartDetails(chart, t);

  return (
    <Modal visible={chart !== null} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.modal}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.subtitle}>{details.unit}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
            <Icon name="times" size={16} color={colors.text1} />
          </TouchableOpacity>
        </View>

        <View style={styles.chartArea}>
          {chart === "price" && priceData.length >= 2 && (
            <LineChart
              data={priceData}
              width={CHART_WIDTH}
              height={420}
              color={colors.accent}
              unit="CHF/L"
              formatY={(value) => value.toFixed(2)}
              showDots
            />
          )}
          {chart === "consumption" && consumptionData.length >= 2 && (
            <LineChart
              data={consumptionData}
              width={CHART_WIDTH}
              height={420}
              color={colors.accentBright}
              unit="L/100km"
              formatY={(value) => value.toFixed(1)}
              showDots
            />
          )}
          {chart === "monthlyFuel" && (
            <BarChart
              data={monthlyFuelData}
              width={CHART_WIDTH}
              height={420}
              color={colors.accentBright}
              formatValue={(value) => value.toFixed(0)}
            />
          )}
          {chart === "monthlyPayments" && (
            <BarChart
              data={monthlyPaymentData}
              width={CHART_WIDTH}
              height={420}
              color={colors.warning}
              formatValue={(value) => value.toFixed(0)}
            />
          )}
          {chart === "yearlyPayments" && (
            <BarChart
              data={yearlyPaymentData}
              width={CHART_WIDTH}
              height={420}
              color={colors.success}
              formatValue={(value) => value.toFixed(0)}
            />
          )}
          {chart === "monthlyTotal" && (
            <BarChart
              data={monthlyTotalData}
              width={CHART_WIDTH}
              height={420}
              color={colors.accent}
              formatValue={(value) => value.toFixed(0)}
            />
          )}
          {chart === "monthlyKm" && monthlyKmData.length >= 2 && (
            <LineChart
              data={monthlyKmData}
              width={CHART_WIDTH}
              height={420}
              color={colors.success}
              unit={t("stats.km")}
              formatY={(value) => value.toFixed(0)}
              showDots
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function getChartDetails(
  chart: ExpandedChart,
  t: (key: string) => string,
): { title: string; unit: string } {
  switch (chart) {
    case "price":
      return { title: t("stats.gasPriceChart"), unit: "CHF/L" };
    case "consumption":
      return { title: t("stats.consumptionChart"), unit: "L/100km" };
    case "monthlyFuel":
      return { title: t("stats.fuelCostChart"), unit: "CHF" };
    case "monthlyPayments":
      return { title: t("stats.monthlyPaymentCostChart"), unit: "CHF" };
    case "yearlyPayments":
      return { title: t("stats.yearlyPaymentCostChart"), unit: "CHF" };
    case "monthlyTotal":
      return { title: t("stats.monthlyTotalCostChart"), unit: "CHF" };
    case "monthlyKm":
      return { title: t("stats.monthlyKmChart"), unit: t("stats.km") };
    default:
      return { title: "", unit: "" };
  }
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: colors.bg0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
  },
  title: {
    ...typography.buttonLarge,
    fontWeight: "700",
    color: colors.text0,
  },
  subtitle: {
    fontSize: typeScale.caption,
    color: colors.text2,
    marginTop: spacing.xxs,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.bg2,
    alignItems: "center",
    justifyContent: "center",
  },
  chartArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});