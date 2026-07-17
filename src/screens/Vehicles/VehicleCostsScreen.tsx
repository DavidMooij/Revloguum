import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import {
  COST_CATEGORIES,
  type CostCategory,
  type IntervalType,
  type VehicleCost,
} from "../../domain/entities/VehicleCost";
import { formatCost } from "../../utils/format";
import { formatDate } from "../../utils/date";
import { haptic } from "@/utils/haptics";
import ScreenHeader from "../components/ScreenHeader";
import AlertModal from "../components/AlertModal";
import EmptyState from "../components/EmptyState";
import DatePickerField from "../AddEntry/components/DatePickerField";
import { useVehicleCosts } from "@/hooks/useVehicleCost";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleCosts">;

const INTERVALS: { key: IntervalType; label: string }[] = [
  { key: null, label: "once" },
  { key: "monthly", label: "monthly" },
  { key: "yearly", label: "yearly" },
];

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

  const [category, setCategory] = useState<CostCategory>("insurance");
  const [amount, setAmount] = useState("");
  const [intervalType, setIntervalType] = useState<IntervalType>(null);
  const [dateTs, setDateTs] = useState(Date.now());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingCost(null);
    setCategory("insurance");
    setAmount("");
    setIntervalType(null);
    setDateTs(Date.now());
    setNotes("");
    setModalVisible(true);
  };

  const openEdit = (cost: VehicleCost) => {
    setEditingCost(cost);
    setCategory(cost.category);
    setAmount(String(cost.amount));
    setIntervalType(cost.intervalType);
    setDateTs(cost.dateTs);
    setNotes(cost.notes ?? "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      haptic.error();
      return;
    }
    haptic.light();
    setSaving(true);
    try {
      if (editingCost) {
        await updateCost(editingCost.id, {
          category,
          amount: amt,
          dateTs,
          intervalType,
          notes: notes.trim() || null,
        });
      } else {
        await addCost({
          vehicleId: vehicleId,
          category,
          amount: amt,
          dateTs,
          intervalType,
          notes: notes.trim() || null,
        });
      }
      haptic.success();
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const grouped = COST_CATEGORIES.map((cat) => ({
    ...cat,
    items: costs.filter((c) => c.category === cat.key),
    total: costs
      .filter((c) => c.category === cat.key)
      .reduce((sum, c) => sum + c.amount, 0),
  })).filter((g) => g.items.length > 0);

  const monthlyEstimate = costs.reduce((sum, c) => {
    if (c.intervalType === "monthly") return sum + c.amount;
    if (c.intervalType === "yearly") return sum + c.amount / 12;
    return sum;
  }, 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader
          title={t("costs.title")}
          showBack
          rightElement={
            <TouchableOpacity
              onPress={openAdd}
              hitSlop={8}
              style={styles.addBtn}
            >
              <Icon name="plus" size={14} color={colors.white} />
            </TouchableOpacity>
          }
        />

        <View style={styles.summaryCard}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>{t("costs.totalLabel")}</Text>
            <Text style={styles.summaryValue}>{formatCost(totalCost)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>{t("costs.monthlyLabel")}</Text>
            <Text style={[styles.summaryValue]}>
              {formatCost(monthlyEstimate)}
            </Text>
          </View>
        </View>

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
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {grouped.map((group) => (
              <View key={group.key} style={styles.group}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupIconWrap}>
                    <Icon name={group.icon} size={13} color={colors.accent} />
                  </View>
                  <Text style={styles.groupTitle}>
                    {t(`costs.categories.${group.key}`)}
                  </Text>
                  <Text style={styles.groupTotal}>
                    {formatCost(group.total)}
                  </Text>
                </View>
                {group.items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.costRow,
                      idx < group.items.length - 1 && styles.costRowBorder,
                    ]}
                    onPress={() => openEdit(item)}
                    onLongPress={() => {
                      haptic.error();
                      setDeleteTarget(item.id);
                    }}
                    activeOpacity={0.72}
                  >
                    <View style={styles.costLeft}>
                      <Text style={styles.costAmount}>
                        {formatCost(item.amount)}
                      </Text>
                      {item.intervalType && (
                        <View style={styles.intervalBadge}>
                          <Text style={styles.intervalText}>
                            {item.intervalType === "monthly"
                              ? t("costs.monthlyShort")
                              : t("costs.yearlyShort")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.costRight}>
                      <Text style={styles.costDate}>
                        {formatDate(item.dateTs)}
                      </Text>
                      {item.notes ? (
                        <Text style={styles.costNotes} numberOfLines={1}>
                          {item.notes}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <Pressable
              style={styles.overlay}
              onPress={() => setModalVisible(false)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View
                  style={[
                    styles.sheet,
                    { paddingBottom: insets.bottom + spacing.xl },
                  ]}
                >
                  <View style={styles.handle} />
                  <Text style={styles.sheetTitle}>
                    {editingCost ? t("costs.editCosts") : t("costs.addCosts")}
                  </Text>

                  <Text style={styles.fieldLabel}>
                    {t("costs.categoryLabel")}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScroll}
                  >
                    <View style={styles.chipRow}>
                      {COST_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.key}
                          style={[
                            styles.catChip,
                            category === cat.key && styles.catChipActive,
                          ]}
                          onPress={() => setCategory(cat.key)}
                        >
                          <Icon
                            name={cat.icon}
                            size={12}
                            color={
                              category === cat.key ? colors.white : colors.text2
                            }
                          />
                          <Text
                            style={[
                              styles.catChipText,
                              category === cat.key && styles.catChipTextActive,
                            ]}
                          >
                            {t(`costs.categories.${cat.key}`)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={styles.fieldLabel}>
                    {t("costs.intervalLabel")}
                  </Text>
                  <View style={[styles.chipRow, { marginBottom: spacing.md }]}>
                    {INTERVALS.map((iv) => (
                      <TouchableOpacity
                        key={String(iv.key)}
                        style={[
                          styles.intervalChip,
                          intervalType === iv.key && styles.intervalChipActive,
                        ]}
                        onPress={() => setIntervalType(iv.key)}
                      >
                        <Text
                          style={[
                            styles.intervalChipText,
                            intervalType === iv.key &&
                              styles.intervalChipTextActive,
                          ]}
                        >
                          {t(`costs.${iv.label}` as any)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>
                        {t("costs.amountLabel")}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        placeholder={t("costs.placeholderCost")}
                        placeholderTextColor={colors.text2}
                        autoFocus={!editingCost}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <DatePickerField
                        value={dateTs}
                        onChange={setDateTs}
                        label={t("costs.datumLabel")}
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>{t("costs.notesLabel")}</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t("costs.placeholderNotes")}
                    placeholderTextColor={colors.text2}
                    multiline
                    numberOfLines={2}
                  />

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelText}>
                        {t("common.cancel")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSave}
                    >
                      {saving ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <Text style={styles.saveBtnText}>
                          {editingCost ? t("costs.save") : t("costs.addBtn")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

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
    </KeyboardAvoidingView>
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
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
  },

  summaryBlock: {
    flex: 1,
  },

  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border1,
    marginHorizontal: spacing.md,
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  summaryValue: {
    marginTop: 5,
    fontSize: 22,
    fontWeight: "800",
    color: colors.text0,
    letterSpacing: -0.6,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, paddingBottom: 60, gap: spacing.md },

  group: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
  },
  groupIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  groupTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.text0 },
  groupTotal: { fontSize: 13, fontWeight: "600", color: colors.text0 },

  costRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  costRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
  },
  costLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  costAmount: { fontSize: 15, fontWeight: "600", color: colors.text0 },
  intervalBadge: {
    backgroundColor: colors.bg3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  intervalText: { fontSize: 10, fontWeight: "600", color: colors.text2 },
  costRight: { flex: 1, alignItems: "flex-end" },
  costDate: { fontSize: 12, color: colors.text2 },
  costNotes: {
    fontSize: 11,
    color: colors.text2,
    fontStyle: "italic",
    maxWidth: 140,
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.bg1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border2,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text0,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  chipScroll: { marginBottom: spacing.md },
  chipRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  catChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDark,
  },
  catChipText: { fontSize: 12, fontWeight: "500", color: colors.text1 },
  catChipTextActive: { color: colors.white, fontWeight: "600" },
  intervalChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
    alignItems: "center",
  },
  intervalChipActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  intervalChipText: { fontSize: 13, fontWeight: "500", color: colors.text1 },
  intervalChipTextActive: { color: colors.accentText, fontWeight: "600" },
  formRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xs },
  formCol: { flex: 1 },
  input: {
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    color: colors.text0,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  notesInput: {
    height: 72,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: colors.text0 },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: colors.white },
});
