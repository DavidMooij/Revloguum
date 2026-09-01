import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  TextInput,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { typeScale, typography } from "../../theme/typography";
import {
  type CostCategory,
  type VehicleCost,
} from "../../domain/entities/VehicleCost";
import { haptic } from "@/utils/haptics";
import AlertModal from "../components/AlertModal";
import EmptyState from "../components/EmptyState";
import { useVehicleCosts } from "@/hooks/useVehicleCost";
import CostSummaryCard from "./components/costs/CostSummaryCard";
import CostGroupsList from "./components/costs/CostGroupsList";
import CostEditModal from "./components/costs/CostEditModal";
import { dateRangeFromPreset, type DateRangePreset } from "@/utils/date";
import { pickBestUnpaidDueForPayment } from "@/domain/services/paymentDue";
import { formatCost } from "@/utils/format";
import { usePaymentTypes } from "@/hooks/usePaymentTypes";
import { usePaymentTypeLabel } from "@/hooks/usePaymentTypeLabel";
import VehicleHistoryLayout from "./components/VehicleHistoryLayout";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleCosts">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const DATE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: "last30", label: "30d" },
  { key: "last90", label: "90d" },
  { key: "last365", label: "1y" },
  { key: "all", label: "All" },
];

export default function VehicleCostsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { costs, intervals, totalCost, addCost, updateCost, deleteCost, loading } =
    useVehicleCosts(vehicleId);
  const { paymentTypes } = usePaymentTypes();
  const getPaymentTypeLabel = usePaymentTypeLabel();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<VehicleCost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<CostCategory[]>([]);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [searchText, setSearchText] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const openAdd = () => {
    setEditingCost(null);
    setModalVisible(true);
  };

  const openEdit = (cost: VehicleCost) => {
    setEditingCost(cost);
    setModalVisible(true);
  };

  const handleSave = async (value: {
    category: VehicleCost["category"];
    amount: number;
    dateTs: number;
    notes: string | null;
    paymentIntervalId: string | null;
  }) => {
    setSaving(true);
    try {
      const baseHistory = editingCost
        ? costs.filter((c) => c.id !== editingCost.id)
        : costs;

      const selectedInterval = value.paymentIntervalId
        ? intervals.find((iv) => iv.id === value.paymentIntervalId) ?? null
        : null;

      const intervalDueTs =
        selectedInterval && value.paymentIntervalId
          ? pickBestUnpaidDueForPayment({
              interval: selectedInterval,
              historyEntries: baseHistory,
              paymentDateTs: value.dateTs,
            })
          : null;

      const payload = {
        category: value.category,
        amount: value.amount,
        dateTs: value.dateTs,
        intervalType: null,
        intervalDays: null,
        paymentIntervalId: value.paymentIntervalId,
        intervalDueTs,
        kind: "history" as const,
        notes: value.notes,
      };

      if (editingCost) {
        await updateCost(editingCost.id, payload);
      } else {
        await addCost({
          vehicleId: vehicleId,
          ...payload,
        });
      }
      haptic.success();
      setModalVisible(false);
      setEditingCost(null);
    } finally {
      setSaving(false);
    }
  };

  const dateRange = useMemo(() => dateRangeFromPreset(datePreset), [datePreset]);

  const paymentTypeById = useMemo(
    () => new Map(paymentTypes.map((pt) => [pt.id, pt])),
    [paymentTypes],
  );

  const getCategoryLabel = useCallback(
    (category: string) => {
      const type = paymentTypeById.get(category);
      if (type) return getPaymentTypeLabel(type);

      const key = `costs.categories.${category}`;
      const translated = t(key);
      return translated === key ? category : translated;
    },
    [paymentTypeById, getPaymentTypeLabel, t],
  );

  const availableCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; label: string; icon: string }[] = [];

    for (const type of paymentTypes) {
      if (seen.has(type.id)) continue;
      seen.add(type.id);
      result.push({
        id: type.id,
        label: getPaymentTypeLabel(type),
        icon: type.icon,
      });
    }

    for (const c of [...costs, ...intervals]) {
      if (seen.has(c.category)) continue;
      seen.add(c.category);
      result.push({
        id: c.category,
        label: getCategoryLabel(c.category),
        icon: "receipt",
      });
    }

    return result;
  }, [paymentTypes, costs, intervals, getPaymentTypeLabel, getCategoryLabel]);

  const filteredCosts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return costs.filter((c) => {
      if (selectedCategories.length && !selectedCategories.includes(c.category)) {
        return false;
      }

      if (dateRange.from != null && c.dateTs < dateRange.from) {
        return false;
      }

      if (dateRange.to != null && c.dateTs > dateRange.to) {
        return false;
      }

      if (!q) return true;

      const note = c.notes?.toLowerCase() ?? "";
      const categoryLabel = getCategoryLabel(c.category).toLowerCase();
      const amountRaw = String(c.amount);
      const amountFixed = c.amount.toFixed(2);
      const amountFormatted = formatCost(c.amount).toLowerCase();
      const normalizedQuery = q.replace(",", ".");

      return (
        note.includes(q) ||
        categoryLabel.includes(q) ||
        amountRaw.includes(normalizedQuery) ||
        amountFixed.includes(normalizedQuery) ||
        amountFormatted.includes(q)
      );
    });
  }, [
    costs,
    selectedCategories,
    dateRange.from,
    dateRange.to,
    searchText,
    getCategoryLabel,
  ]);

  const sortedCosts = useMemo(
    () =>
      [...filteredCosts].sort((a, b) => {
        if (b.dateTs !== a.dateTs) return b.dateTs - a.dateTs;
        return b.createdAt - a.createdAt;
      }),
    [filteredCosts],
  );

  const monthlyEstimate = useMemo(
    () =>
      intervals.reduce((sum, c) => {
        if (c.intervalType === "monthly") return sum + c.amount;
        if (c.intervalType === "yearly") return sum + c.amount / 12;
        if (c.intervalType === "custom" && c.intervalDays) {
          return sum + (c.amount * 30) / c.intervalDays;
        }
        return sum;
      }, 0),
    [intervals],
  );

  const hasFilter =
    selectedCategories.length > 0 || datePreset !== "all" || searchText.length > 0;

  const toggleCategory = (category: CostCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  return (
    <VehicleHistoryLayout
      title={t("payments.historyTitle")}
      onAdd={openAdd}
    >

      <View style={styles.filterContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Icon name="search" size={13} color={colors.text2} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("payments.searchPlaceholder")}
              placeholderTextColor={colors.text2}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")} hitSlop={8}>
                <Icon name="times-circle" size={13} color={colors.text2} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterBtn, filtersExpanded && styles.filterBtnActive]}
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
            <View style={styles.chipRow}>
              {DATE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.key}
                  style={[styles.chip, datePreset === preset.key && styles.chipActive]}
                  onPress={() => {
                    haptic.selection();
                    setDatePreset(preset.key);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      datePreset === preset.key && styles.chipTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>{t("payments.category")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {availableCategories.map((cat) => {
                  const active = selectedCategories.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        haptic.selection();
                        toggleCategory(cat.id);
                      }}
                    >
                      <Icon
                        name={cat.icon as any}
                        size={11}
                        color={active ? colors.accentText : colors.text2}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {hasFilter && (
              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  setSelectedCategories([]);
                  setDatePreset("all");
                  setSearchText("");
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>{t("history.clearFilters")}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <CostSummaryCard
        totalCost={totalCost}
        monthlyEstimate={monthlyEstimate}
        totalLabel={t("payments.totalPaidLabel")}
        monthlyLabel={t("payments.monthlyEstimateLabel")}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : filteredCosts.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={t("payments.noPayments")}
          subtitle={t("payments.noPaymentsHint")}
        />
      ) : (
        <CostGroupsList
          entries={sortedCosts}
          paymentTypes={paymentTypes}
          onEdit={openEdit}
          onDeleteRequest={setDeleteTarget}
          onDocuments={(cost) =>
            navigation.navigate("Documents", {
              vehicleId,
              ownerType: "cost",
              ownerId: cost.id,
              title: t("documents.paymentTitle"),
            })
          }
        />
      )}

      <CostEditModal
        visible={modalVisible}
        editingCost={editingCost}
        paymentIntervals={intervals}
        paymentTypes={paymentTypes}
        insetsBottom={insets.bottom}
        saving={saving}
        onClose={() => {
          setModalVisible(false);
          setEditingCost(null);
        }}
        onSubmit={handleSave}
      />

      <AlertModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        icon="trash-alt"
        iconColor={colors.dangerText}
        title={t("payments.deletePayment")}
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
              if (deleteTarget) {
                haptic.error();
                await deleteCost(deleteTarget);
              }
            },
          },
        ]}
      />
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
  chipRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  chipActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  chipText: { fontSize: typeScale.captionLarge, fontWeight: "500", color: colors.text1 },
  chipTextActive: { color: colors.accentText, fontWeight: "600" },
  clearBtn: { alignSelf: "center", paddingVertical: spacing.sm },
  clearText: { color: colors.accent, fontSize: typeScale.bodySmall, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
