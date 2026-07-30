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
  COST_CATEGORIES,
  type CostCategory,
  type IntervalType,
  type VehicleCost,
} from "../../../../domain/entities/VehicleCost";
import { haptic } from "@/utils/haptics";
import DatePickerField from "../../../AddEntry/components/DatePickerField";

interface CostFormValue {
  category: CostCategory;
  amount: number;
  intervalType: IntervalType;
  dateTs: number;
  notes: string | null;
}

interface Props {
  visible: boolean;
  editingCost: VehicleCost | null;
  insetsBottom: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (value: CostFormValue) => Promise<void>;
}

const INTERVALS: { key: IntervalType; label: string }[] = [
  { key: null, label: "once" },
  { key: "monthly", label: "monthly" },
  { key: "yearly", label: "yearly" },
];

export default function CostEditModal({
  visible,
  editingCost,
  insetsBottom,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<CostCategory>("insurance");
  const [amount, setAmount] = useState("");
  const [intervalType, setIntervalType] = useState<IntervalType>(null);
  const [dateTs, setDateTs] = useState(Date.now());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!visible) return;
    if (editingCost) {
      setCategory(editingCost.category);
      setAmount(String(editingCost.amount));
      setIntervalType(editingCost.intervalType);
      setDateTs(editingCost.dateTs);
      setNotes(editingCost.notes ?? "");
      return;
    }
    setCategory("insurance");
    setAmount("");
    setIntervalType(null);
    setDateTs(Date.now());
    setNotes("");
  }, [visible, editingCost]);

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
      intervalType,
      dateTs,
      notes: notes.trim() || null,
    });
  };

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
                        color={category === cat.key ? colors.white : colors.text2}
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

              <Text style={styles.fieldLabel}>{t("costs.intervalLabel")}</Text>
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
                        intervalType === iv.key && styles.intervalChipTextActive,
                      ]}
                    >
                      {t(`costs.${iv.label}` as any)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
  intervalChipText: { fontSize: typeScale.bodySmall, fontWeight: "500", color: colors.text1 },
  intervalChipTextActive: { color: colors.accentText, fontWeight: "600" },
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
