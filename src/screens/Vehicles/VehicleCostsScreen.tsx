import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import {
  COST_CATEGORIES,
  type VehicleCost,
} from "../../domain/entities/VehicleCost";
import { haptic } from "@/utils/haptics";
import ScreenHeader from "../components/ScreenHeader";
import AlertModal from "../components/AlertModal";
import EmptyState from "../components/EmptyState";
import { useVehicleCosts } from "@/hooks/useVehicleCost";
import CostSummaryCard from "./components/costs/CostSummaryCard";
import CostGroupsList, {
  type CostGroupView,
} from "./components/costs/CostGroupsList";
import CostEditModal from "./components/costs/CostEditModal";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleCosts">;

function buildCostGroups(costs: VehicleCost[]): CostGroupView[] {
  return COST_CATEGORIES.map((cat) => {
    const items = costs.filter((c) => c.category === cat.key);
    const total = items.reduce((sum, c) => sum + c.amount, 0);
    return {
      key: cat.key,
      icon: cat.icon,
      items,
      total,
    };
  }).filter((group) => group.items.length > 0);
}

export default function VehicleCostsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { costs, totalCost, addCost, updateCost, deleteCost, loading } =
    useVehicleCosts(vehicleId);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<VehicleCost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    intervalType: VehicleCost["intervalType"];
    dateTs: number;
    notes: string | null;
  }) => {
    setSaving(true);
    try {
      if (editingCost) {
        await updateCost(editingCost.id, {
          category: value.category,
          amount: value.amount,
          dateTs: value.dateTs,
          intervalType: value.intervalType,
          notes: value.notes,
        });
      } else {
        await addCost({
          vehicleId: vehicleId,
          category: value.category,
          amount: value.amount,
          dateTs: value.dateTs,
          intervalType: value.intervalType,
          notes: value.notes,
        });
      }
      haptic.success();
      setModalVisible(false);
      setEditingCost(null);
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => buildCostGroups(costs), [costs]);

  const monthlyEstimate = useMemo(
    () =>
      costs.reduce((sum, c) => {
        if (c.intervalType === "monthly") return sum + c.amount;
        if (c.intervalType === "yearly") return sum + c.amount / 12;
        return sum;
      }, 0),
    [costs],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("costs.title")}
        showBack
        rightElement={
          <TouchableOpacity onPress={openAdd} hitSlop={8} style={styles.addBtn}>
            <Icon name="plus" size={14} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <CostSummaryCard
        totalCost={totalCost}
        monthlyEstimate={monthlyEstimate}
        totalLabel={t("costs.totalLabel")}
        monthlyLabel={t("costs.monthlyLabel")}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : costs.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={t("costs.noCosts")}
          subtitle={t("costs.noCostsHint")}
        />
      ) : (
        <CostGroupsList
          groups={grouped}
          onEdit={openEdit}
          onDeleteRequest={setDeleteTarget}
        />
      )}

      <CostEditModal
        visible={modalVisible}
        editingCost={editingCost}
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
        title={t("costs.deleteCost")}
        message={t("common.cannotBeUndone")}
        actions={[
          {
            label: t("costs.abort"),
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
