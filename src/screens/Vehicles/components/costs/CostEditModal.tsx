import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../../theme/colors";
import { spacing, radius } from "../../../../theme/spacing";
import { typography, typeScale } from "../../../../theme/typography";
import {
  type CostCategory,
  type VehicleCost,
} from "../../../../domain/entities/VehicleCost";
import type { PaymentType } from "@/domain/entities/PaymentType";
import { haptic } from "@/utils/haptics";
import DatePickerField from "../../../AddEntry/components/DatePickerField";
import { usePaymentTypeLabel } from "@/hooks/usePaymentTypeLabel";

interface CostFormValue {
  category: CostCategory;
  amount: number;
  dateTs: number;
  notes: string | null;
  paymentIntervalId: string | null;
}

interface Props {
  visible: boolean;
  editingCost: VehicleCost | null;
  paymentIntervals: VehicleCost[];
  paymentTypes: PaymentType[];
  insetsBottom: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (value: CostFormValue) => Promise<void>;
}

function intervalBadgeLabel(
  interval: VehicleCost,
  t: (key: string) => string,
): string {
  if (interval.intervalType === "monthly") return t("costs.monthlyShort");
  if (interval.intervalType === "yearly") return t("costs.yearlyShort");
  return `${interval.intervalDays ?? 0}d`;
}

export default function CostEditModal({
  visible,
  editingCost,
  paymentIntervals,
  paymentTypes,
  insetsBottom,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const getPaymentTypeLabel = usePaymentTypeLabel();
  const paymentTypeById = new Map(paymentTypes.map((pt) => [pt.id, pt]));
  const defaultCategory = paymentTypes[0]?.id ?? "insurance";
  const [category, setCategory] = useState<CostCategory>(defaultCategory);
  const [amount, setAmount] = useState("");
  const [dateTs, setDateTs] = useState(Date.now());
  const [notes, setNotes] = useState("");
  const [paymentIntervalId, setPaymentIntervalId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (editingCost) {
      setCategory(editingCost.category);
      setAmount(String(editingCost.amount));
      setDateTs(editingCost.dateTs);
      setNotes(editingCost.notes ?? "");
      setPaymentIntervalId(editingCost.paymentIntervalId ?? null);
      return;
    }
    setCategory(defaultCategory);
    setAmount("");
    setDateTs(Date.now());
    setNotes("");
    setPaymentIntervalId(null);
  }, [visible, editingCost, defaultCategory]);

  useEffect(() => {
    if (!paymentIntervalId) return;
    const selected = paymentIntervals.find((iv) => iv.id === paymentIntervalId);
    if (!selected) return;
    setCategory(selected.category);
    setAmount(String(selected.amount));
  }, [paymentIntervalId, paymentIntervals]);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      haptic.error();
      return;
    }

    haptic.light();
    await onSubmit({
      category,
      amount: amt,
      dateTs,
      notes: notes.trim() || null,
      paymentIntervalId,
    });
  };

  const linkedInterval = paymentIntervals.find((iv) => iv.id === paymentIntervalId) ?? null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.sheet,
                { paddingBottom: insetsBottom + spacing.xl },
              ]}
            >
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>
                {editingCost ? t("costs.editCosts") : t("costs.addCosts")}
              </Text>

              <Text style={styles.fieldLabel}>{t("costs.categoryLabel")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
              >
                <View style={styles.chipRow}>
                  {paymentTypes.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        category === cat.id && styles.catChipActive,
                        paymentIntervalId && styles.catChipDisabled,
                      ]}
                      onPress={() => {
                        if (paymentIntervalId) return;
                        setCategory(cat.id);
                      }}
                      disabled={!!paymentIntervalId}
                    >
                      <Icon
                        name={cat.icon}
                        size={12}
                        color={category === cat.id ? colors.white : colors.text2}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          category === cat.id && styles.catChipTextActive,
                        ]}
                      >
                        {getPaymentTypeLabel(cat)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>{t("payments.linkToInterval")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[
                      styles.linkChip,
                      paymentIntervalId === null && styles.linkChipActive,
                    ]}
                    onPress={() => setPaymentIntervalId(null)}
                  >
                    <Text
                      style={[
                        styles.linkChipText,
                        paymentIntervalId === null && styles.linkChipTextActive,
                      ]}
                    >
                      {t("costs.once")}
                    </Text>
                  </TouchableOpacity>

                  {paymentIntervals.map((interval) => {
                    const active = paymentIntervalId === interval.id;
                    const intervalType = paymentTypeById.get(interval.category);
                    const fallbackKey = `costs.categories.${interval.category}`;
                    const intervalLabel = intervalType
                      ? getPaymentTypeLabel(intervalType)
                      : (() => {
                          const translated = t(fallbackKey);
                          return translated === fallbackKey
                            ? interval.category
                            : translated;
                        })();
                    return (
                      <TouchableOpacity
                        key={interval.id}
                        style={[styles.linkChip, active && styles.linkChipActive]}
                        onPress={() => setPaymentIntervalId(interval.id)}
                      >
                        <Text style={[styles.linkChipText, active && styles.linkChipTextActive]}>
                          {intervalLabel}
                        </Text>
                        <Text
                          style={[
                            styles.linkChipSub,
                            active && styles.linkChipSubActive,
                          ]}
                        >
                          {formatAmount(interval.amount)} · {intervalBadgeLabel(interval, t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>{t("costs.amountLabel")}</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder={t("costs.placeholderCost")}
                    placeholderTextColor={colors.text2}
                    autoFocus={!editingCost}
                    editable={!linkedInterval}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>{t("costs.dateLabel")}</Text>
                  <DatePickerField
                    value={dateTs}
                    onChange={setDateTs}
                    showLabel={false}
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
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>{t("common.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={submit}>
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
  );
}

function formatAmount(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

const styles = StyleSheet.create({
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
    ...typography.buttonLarge,
    fontWeight: "700",
    color: colors.text0,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.overline,
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
  catChipText: { fontSize: typeScale.captionLarge, fontWeight: "500", color: colors.text1 },
  catChipTextActive: { color: colors.white, fontWeight: "600" },
  catChipDisabled: {
    opacity: 0.45,
  },
  linkChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
    alignItems: "flex-start",
  },
  linkChipActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  linkChipText: {
    fontSize: typeScale.bodySmall,
    fontWeight: "600",
    color: colors.text1,
  },
  linkChipTextActive: { color: colors.accentText },
  linkChipSub: {
    marginTop: 2,
    fontSize: typeScale.overline,
    color: colors.text2,
  },
  linkChipSubActive: {
    color: colors.accentText,
  },
  formRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xs },
  formCol: { flex: 1 },
  input: {
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    color: colors.text0,
    fontSize: typeScale.body,
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
  cancelText: { ...typography.button, color: colors.text0 },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { ...typography.button, color: colors.white },
});
