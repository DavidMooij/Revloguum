import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { typography, typeScale } from "../../theme/typography";
import { useFuel } from "../../hooks/useFuel";
import { useVehicles } from "../../hooks/useVehicles";
import {
  dateRangeFromPreset,
  formatDate,
  type DateRangePreset,
} from "../../utils/date";
import { formatCost } from "../../utils/format";
import EmptyState from "../components/EmptyState";
import AlertModal from "../components/AlertModal";
import QuickFuelModal from "../Fuel/QuickFuelModal";
import type { FuelEntry } from "../../domain/entities/FuelEntry";
import { useFeedback } from "../components/feedback/Feedbackprovider";
import { haptic } from "@/utils/haptics";
import VehicleHistoryLayout from "./components/VehicleHistoryLayout";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleFuelHistory">;

export default function VehicleFuelHistoryScreen() {
  const { t } = useTranslation();

  const PRESETS: { key: DateRangePreset; label: string }[] = [
    { key: "last30", label: "30d" },
    { key: "last90", label: "90d" },
    { key: "last365", label: "1y" },
    { key: "all", label: t("fuel.all") },
  ];
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { vehicles } = useVehicles();
  const { showToast } = useFeedback();
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const [fuelModal, setFuelModal] = useState(false);
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [searchText, setSearchText] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<FuelEntry | null>(null);
  const [editTarget, setEditTarget] = useState<FuelEntry | null>(null);
  const dateRange = useMemo(() => dateRangeFromPreset(preset), [preset]);
  const hasFilter = preset !== "all" || searchText.trim().length > 0;
  const filter = useMemo(
    () => ({
      vehicleId,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      searchText: searchText.trim() || undefined,
    }),
    [vehicleId, dateRange.from, dateRange.to, searchText],
  );
  const { entries, stats, loading, deleteEntry, addEntry, updateEntry } =
    useFuel(filter);

  const renderFuelMeta = (entry: FuelEntry) => {
    const kmText = t("fuel.odometerDisplay", {
      km: entry.odometerKm.toLocaleString(),
    });
    const perLiterText = `${formatCost(entry.cost / entry.liters)}/L`;
    const compact = `${kmText} · ${perLiterText}`;
    const shouldUseTwoLines = compact.length > 26 || kmText.length > 17;

    if (!shouldUseTwoLines) {
      return (
        <Text
          style={styles.entryMetaOneLine}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {compact}
        </Text>
      );
    }

    return (
      <View style={styles.entryMetaTwoLines}>
        <Text style={styles.entryMetaLine} numberOfLines={1}>
          {kmText}
        </Text>
        <Text style={styles.entryMetaLine} numberOfLines={1}>
          {perLiterText}
        </Text>
      </View>
    );
  };

  return (
    <VehicleHistoryLayout
      title={t("fuel.title")}
      onAdd={() => setFuelModal(true)}
      showAdd={!!vehicle}
    >

      <View style={styles.filterContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Icon
              name="search"
              size={13}
              color={colors.text2}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("fuel.searchPlaceholder")}
              placeholderTextColor={colors.text2}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")} hitSlop={8}>
                <Icon name="times-circle" size={13} color={colors.text2} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              filtersExpanded && styles.filterBtnActive,
            ]}
            onPress={() => {
              haptic.light();
              setFiltersExpanded((prev) => !prev);
            }}
          >
            <Icon
              name="sliders-h"
              size={14}
              color={filtersExpanded ? colors.accent : colors.text1}
            />
            {hasFilter && <View style={styles.dot} />}
          </TouchableOpacity>
        </View>

        {filtersExpanded && (
          <View style={styles.expanded}>
            <Text style={styles.filterLabel}>{t("history.dateRange")}</Text>
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.preset,
                    preset === p.key && styles.presetActive,
                  ]}
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

            <Text style={styles.filterLabel}>{t("fuel.entryType")}</Text>

            {hasFilter && (
              <TouchableOpacity
                onPress={() => {
                  setPreset("all");
                  setSearchText("");
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>
                  {t("history.clearFilters")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text
            style={styles.statValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {stats.totalLiters.toFixed(1)} L
          </Text>
          <Text style={styles.statLabel} numberOfLines={2}>
            {t("fuel.statTotal")}
          </Text>
        </View>

        <View style={styles.statDiv} />

        <View style={styles.stat}>
          <Text
            style={styles.statValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {formatCost(stats.totalCost)}
          </Text>
          <Text style={styles.statLabel} numberOfLines={2}>
            {t("fuel.statCost")}
          </Text>
        </View>

        <View style={styles.statDiv} />

        <View style={styles.stat}>
          <Text
            style={styles.statValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {stats.avgConsumption.toFixed(1)} L
          </Text>
          <Text style={styles.statLabel} numberOfLines={2}>
            {t("fuel.statPer100km")}
          </Text>
        </View>

        <View style={styles.statDiv} />

        <View style={styles.stat}>
          <Text
            style={styles.statValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {formatCost(stats.avgCostPerLiter)}
          </Text>
          <Text style={styles.statLabel} numberOfLines={2}>
            {t("fuel.statPerLiter")}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.entry}
              onLongPress={() => setActionTarget(item)}
              activeOpacity={0.8}
            >
              <View style={styles.entryIcon}>
                <Icon name="gas-pump" size={14} color={colors.accent} />
              </View>
              <View style={styles.entryContent}>
                <View style={styles.entryTop}>
                  <View style={styles.entryTopLeft}>
                    <Text style={styles.entryTitle} numberOfLines={1}>
                      {t("fuel.litersDisplay", {
                        liters: item.liters.toFixed(2),
                      })}
                    </Text>
                    {renderFuelMeta(item)}
                  </View>

                  <View style={styles.entryRightCol}>
                    <Text style={styles.entryCost} numberOfLines={1}>
                      {formatCost(item.cost)}
                    </Text>
                    <Text style={styles.entryDateRight} numberOfLines={1}>
                      {formatDate(item.dateTs)}
                    </Text>
                  </View>
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
        visible={!!actionTarget}
        onClose={() => setActionTarget(null)}
        icon="gas-pump"
        iconColor={colors.accentText}
        title={
          actionTarget
            ? t("fuel.litersDisplay", {
                liters: actionTarget.liters.toFixed(2),
              })
            : ""
        }
        message={t("history.whatToDo")}
        actions={[
          {
            label: t("common.edit"),
            variant: "primary",
            onPress: () => setEditTarget(actionTarget),
          },
          {
            label: t("common.delete"),
            variant: "danger",
            onPress: () => setDeleteTarget(actionTarget?.id ?? null),
          },
          {
            label: t("common.cancel"),
            variant: "secondary",
            onPress: () => {},
          },
        ]}
      />
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
          visible={fuelModal || !!editTarget}
          editEntry={editTarget}
          onClose={() => {
            setFuelModal(false);
            setEditTarget(null);
          }}
          onSave={async (data) => {
            if (editTarget) {
              await updateEntry(editTarget.id, {
                odometerKm: data.odometerKm,
                liters: data.liters,
                cost: data.cost,
                notes: data.notes,
              });
            } else {
              await addEntry({
                vehicleId,
                odometerKm: data.odometerKm,
                liters: data.liters,
                cost: data.cost,
                notes: data.notes,
                dateTs: Date.now(),
              });
            }
            setFuelModal(false);
            setEditTarget(null);
            showToast({ titleKey: "toast.fuelAdded", variant: "success" });
          }}
          vehicle={vehicle}
          lastEntry={editTarget ? null : (entries[0] ?? null)}
        />
      )}
    </VehicleHistoryLayout>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    backgroundColor: colors.bg0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.sm,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    color: colors.text0,
    fontSize: typeScale.bodyMedium,
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  dot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  expanded: { gap: spacing.md },
  filterLabel: {
    ...typography.overline,
  },
  presetRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
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
  presetText: {
    fontSize: typeScale.captionLarge,
    fontWeight: "500",
    color: colors.text1,
  },
  presetTextActive: { color: colors.accentText, fontWeight: "600" },
  clearBtn: { alignSelf: "center", paddingVertical: spacing.sm },
  clearText: {
    color: colors.accent,
    fontSize: typeScale.bodySmall,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    gap: 2,
  },
  statDiv: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border0,
  },
  statValue: {
    ...typography.bodyMediumStrong,
    color: colors.text0,
    textAlign: "center",
    width: "100%",
    flexShrink: 1,
  },
  statLabel: {
    fontSize: typeScale.overline,
    color: colors.text2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
    width: "100%",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg, paddingBottom: 120 },
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
  entryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  entryTopLeft: { flex: 1, minWidth: 0, gap: 3 },
  entryTitle: { ...typography.bodyStrong, color: colors.text0 },
  entryRightCol: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    gap: 2,
    minWidth: 96,
  },
  entryCost: {
    fontSize: typeScale.bodyLarge,
    fontWeight: "800",
    color: colors.successText,
  },
  entryDateRight: {
    fontSize: typeScale.captionLarge,
    color: colors.text2,
    fontWeight: "500",
  },
  entryMetaOneLine: { fontSize: typeScale.captionLarge, color: colors.text2 },
  entryMetaTwoLines: { gap: 1 },
  entryMetaLine: { fontSize: typeScale.captionLarge, color: colors.text2 },
  entryNotes: { fontSize: typeScale.captionLarge, color: colors.text1 },
});
