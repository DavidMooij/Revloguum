import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { useFuel } from "../../hooks/useFuel";
import { useVehicles } from "../../hooks/useVehicles";
import {
  dateRangeFromPreset,
  formatDate,
  formatDateShort,
  type DateRangePreset,
} from "../../utils/date";
import { formatCost } from "../../utils/format";
import ScreenHeader from "../components/ScreenHeader";
import EmptyState from "../components/EmptyState";
import AlertModal from "../components/AlertModal";
import QuickFuelModal from "../Fuel/QuickFuelModal";
import LineChart, { LineChartPoint } from "./components/charts/LineChart";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleFuelHistory">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

export default function VehicleFuelHistoryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const PRESETS: { key: DateRangePreset; label: string }[] = [
    { key: "last30", label: "30d" },
    { key: "last90", label: "90d" },
    { key: "last365", label: "1y" },
    { key: "all", label: t("fuel.all") },
  ];
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { vehicles } = useVehicles();
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const [fuelModal, setFuelModal] = useState(false);
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const dateRange = useMemo(() => dateRangeFromPreset(preset), [preset]);
  const filter = useMemo(
    () => ({ vehicleId, dateFrom: dateRange.from, dateTo: dateRange.to }),
    [vehicleId, dateRange.from, dateRange.to],
  );
  const { entries, stats, loading, deleteEntry, addEntry } = useFuel(filter);

  const chronological = [...entries].reverse();

  const priceLineData: LineChartPoint[] = chronological
    .filter((e) => e.liters > 0)
    .map((e) => ({
      x: e.dateTs,
      y: parseFloat((e.cost / e.liters).toFixed(3)),
      label: formatDateShort(e.dateTs),
    }));

  const consumptionLineData: LineChartPoint[] = chronological
    .slice(1)
    .map((e, i) => {
      const prev = chronological[i];
      const km = e.odometerKm - prev.odometerKm;
      if (km <= 0) return null;
      return {
        x: e.dateTs,
        y: parseFloat(((e.liters / km) * 100).toFixed(2)),
        label: formatDateShort(e.dateTs),
      };
    })
    .filter(Boolean) as LineChartPoint[];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("fuel.title")}
        showBack
        rightElement={
          vehicle ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setFuelModal(true)}
              hitSlop={8}
            >
              <Icon name="plus" size={14} color={colors.white} />
            </TouchableOpacity>
          ) : null
        }
      />
      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.preset, preset === p.key && styles.presetActive]}
            onPress={() => setPreset(p.key)}
          >
            <Text
              style={[
                styles.presetText,
                preset === p.key && styles.presetTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.totalLiters.toFixed(1)} L</Text>
          <Text style={styles.statLabel}>{t("fuel.statTotal")}</Text>
        </View>
        <View style={styles.statDiv} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatCost(stats.totalCost)}</Text>
          <Text style={styles.statLabel}>{t("fuel.statCost")}</Text>
        </View>
        <View style={styles.statDiv} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {stats.avgConsumption.toFixed(1)} L
          </Text>
          <Text style={styles.statLabel}>{t("fuel.statPer100km")}</Text>
        </View>
        <View style={styles.statDiv} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatCost(stats.avgCostPerLiter)}
          </Text>
          <Text style={styles.statLabel}>{t("fuel.statPerLiter")}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlashList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="gas-pump"
              title={t("fuel.noEntries")}
              subtitle={t("fuel.noEntriesSubtitle")}
            />
          }
          ListHeaderComponent={
            entries.length >= 2 ? (
              <View style={styles.chartsSection}>
                {priceLineData.length >= 2 && (
                  <View style={styles.chartCard}>
                    <LineChart
                      data={priceLineData}
                      width={CHART_WIDTH - spacing.lg * 2}
                      height={160}
                      color={colors.accent}
                      title={t("fuel.gasPriceChart")}
                      unit="CHF/L"
                      formatY={(v) => v.toFixed(2)}
                    />
                  </View>
                )}

                {consumptionLineData.length >= 2 && (
                  <View style={styles.chartCard}>
                    <LineChart
                      data={consumptionLineData}
                      width={CHART_WIDTH - spacing.lg * 2}
                      height={160}
                      color={colors.accentBright}
                      title={t("fuel.consumptionChart")}
                      unit="L/100km"
                      formatY={(v) => v.toFixed(1)}
                    />
                  </View>
                )}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.entry}
              onLongPress={() => setDeleteTarget(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.entryIcon}>
                <Icon name="gas-pump" size={14} color={colors.accent} />
              </View>
              <View style={styles.entryContent}>
                <View style={styles.entryTop}>
                  <Text style={styles.entryTitle}>
                    {t("fuel.litersDisplay", {
                      liters: item.liters.toFixed(2),
                    })}
                  </Text>
                  <Text style={styles.entryCost}>{formatCost(item.cost)}</Text>
                </View>
                <View style={styles.entryBottom}>
                  <Text style={styles.entrySub}>{formatDate(item.dateTs)}</Text>
                  <Text style={styles.entryDot}>·</Text>
                  <Text style={styles.entrySub}>
                    {t("fuel.odometerDisplay", {
                      km: item.odometerKm.toLocaleString(),
                    })}
                  </Text>
                  <Text style={styles.entryDot}>·</Text>
                  <Text style={styles.entrySub}>
                    {formatCost(item.cost / item.liters)}/L
                  </Text>
                </View>
                {item.notes ? (
                  <Text style={styles.entryNotes} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <AlertModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        icon="trash-alt"
        iconColor={colors.dangerText}
        title={t("fuel.deleteEntry")}
        message={t("common.cannotBeUndone")}
        actions={[
          {
            label: t("common.cancel"),
            variant: "secondary",
            onPress: () => {},
          },
          {
            label: t("common.delete"),
            variant: "danger",
            onPress: async () => {
              if (deleteTarget) await deleteEntry(deleteTarget);
            },
          },
        ]}
      />
      {vehicle && (
        <QuickFuelModal
          visible={fuelModal}
          onClose={() => setFuelModal(false)}
          onSave={async (data) => {
            await addEntry({
              vehicleId,
              odometerKm: data.odometerKm,
              liters: data.liters,
              cost: data.cost,
              notes: data.notes,
              dateTs: Date.now(),
            });
            setFuelModal(false);
          }}
          vehicle={vehicle}
          lastEntry={entries[0] ?? null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  presetRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  presetActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  presetText: { fontSize: 12, fontWeight: "500", color: colors.text1 },
  presetTextActive: { color: colors.accentText, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statDiv: { width: 1, backgroundColor: colors.border0 },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text0,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg, paddingBottom: 60 },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  entryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  entryContent: { flex: 1, gap: 3 },
  entryTop: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontSize: 15, fontWeight: "600", color: colors.text0 },
  entryCost: { fontSize: 14, fontWeight: "600", color: colors.successText },
  entryBottom: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  entrySub: { fontSize: 12, color: colors.text2 },
  entryDot: { fontSize: 12, color: colors.text3 },
  entryNotes: { fontSize: 12, color: colors.text2, fontStyle: "italic" },
  chartsSection: { gap: spacing.md, marginBottom: spacing.md },
  chartCard: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
  },
});
