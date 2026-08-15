import React from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import DatePickerField from "@/screens/AddEntry/components/DatePickerField";
import {
  type CostCategory,
  type IntervalType,
} from "@/domain/entities/VehicleCost";
import type { PaymentType } from "@/domain/entities/PaymentType";
import { colors, radius, spacing } from "@/theme";
import { typography, typeScale } from "@/theme/typography";
import { usePaymentTypeLabel } from "@/hooks/usePaymentTypeLabel";

export interface PaymentIntervalDraft {
  id: string;
  category: CostCategory;
  amount: number;
  intervalType: Exclude<IntervalType, null>;
  intervalDays: number;
  startDateTs: number;
  notes: string | null;
}

interface Props {
  paymentTypes: PaymentType[];
  intervals: PaymentIntervalDraft[];
  onChange: (intervals: PaymentIntervalDraft[]) => void;
  onAdd: () => void;
}

function normalizeIntervalDays(
  intervalType: Exclude<IntervalType, null>,
  currentDays: number,
): number {
  if (intervalType === "monthly") return 30;
  if (intervalType === "yearly") return 365;
  return Math.max(1, Math.floor(currentDays || 30));
}

export default function PaymentIntervalConfig({
  paymentTypes,
  intervals,
  onChange,
  onAdd,
}: Props) {
  const { t } = useTranslation();
  const getPaymentTypeLabel = usePaymentTypeLabel();
  const paymentTypeById = new Map(paymentTypes.map((pt) => [pt.id, pt]));

  const updateAt = (index: number, patch: Partial<PaymentIntervalDraft>) => {
    onChange(intervals.map((iv, i) => (i === index ? { ...iv, ...patch } : iv)));
  };

  const removeAt = (index: number) => {
    onChange(intervals.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("vehicles.paymentIntervals")}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Icon name="plus" size={12} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>{t("vehicles.paymentIntervalsHint")}</Text>

      {intervals.length === 0 && (
        <Text style={styles.empty}>{t("vehicles.noPaymentIntervals")}</Text>
      )}

      {intervals.map((iv, index) => {
        const selectedType = paymentTypeById.get(iv.category);
        const fallbackKey = `costs.categories.${iv.category}`;
        const selectedLabel = selectedType
          ? getPaymentTypeLabel(selectedType)
          : (() => {
              const translated = t(fallbackKey);
              return translated === fallbackKey ? iv.category : translated;
            })();

        return (
          <View key={iv.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTopLeft}>
                <View style={styles.cardIcon}>
                  <Icon
                    name={selectedType?.icon ?? "receipt"}
                    size={13}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.cardTitle}>{selectedLabel}</Text>
              </View>

              <TouchableOpacity onPress={() => removeAt(index)} style={styles.removeBtn}>
                <Icon name="times" size={13} color={colors.text2} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeRow}>
                {paymentTypes.map((cat) => {
                  const active = iv.category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, active && styles.catChipActive]}
                      onPress={() => updateAt(index, { category: cat.id })}
                    >
                      <Icon
                        name={cat.icon}
                        size={11}
                        color={active ? colors.white : colors.text2}
                      />
                      <Text style={[styles.catText, active && styles.catTextActive]}>
                        {getPaymentTypeLabel(cat)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{t("costs.amountLabel")}</Text>
              <TextInput
                style={styles.input}
                value={iv.amount > 0 ? String(iv.amount) : ""}
                onChangeText={(txt) => {
                  const parsed = Number.parseFloat(txt.replace(",", "."));
                  updateAt(index, {
                    amount: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
                  });
                }}
                keyboardType="decimal-pad"
                placeholder={t("costs.placeholderCost")}
                placeholderTextColor={colors.text2}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{t("payments.startDate")}</Text>
              <DatePickerField
                value={iv.startDateTs}
                onChange={(next) => updateAt(index, { startDateTs: next })}
                showLabel={false}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>{t("costs.intervalLabel")}</Text>
          <View style={styles.intervalRow}>
            {([
              ["monthly", t("costs.monthly")],
              ["yearly", t("costs.yearly")],
              ["custom", t("payments.custom")],
            ] as [Exclude<IntervalType, null>, string][]).map(([type, label]) => {
              const active = iv.intervalType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.intervalChip, active && styles.intervalChipActive]}
                  onPress={() =>
                    updateAt(index, {
                      intervalType: type,
                      intervalDays: normalizeIntervalDays(type, iv.intervalDays),
                    })
                  }
                >
                  <Text
                    style={[
                      styles.intervalChipText,
                      active && styles.intervalChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {iv.intervalType === "custom" && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.fieldLabel}>{t("payments.customDays")}</Text>
              <TextInput
                style={styles.input}
                value={String(iv.intervalDays || "")}
                onChangeText={(txt) => {
                  const parsed = Number.parseInt(txt, 10);
                  updateAt(index, {
                    intervalDays: Number.isFinite(parsed) ? Math.max(1, parsed) : 1,
                  });
                }}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.text2}
              />
            </View>
          )}

          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.fieldLabel}>{t("costs.notesLabel")}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={iv.notes ?? ""}
              onChangeText={(txt) =>
                updateAt(index, { notes: txt.trim() ? txt : null })
              }
              placeholder={t("costs.placeholderNotes")}
              placeholderTextColor={colors.text2}
              multiline
              numberOfLines={2}
            />
          </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...typography.bodySmall, fontWeight: "600", color: colors.text0 },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: typeScale.captionLarge,
    color: colors.text2,
    marginTop: -spacing.xs,
  },
  empty: {
    fontSize: typeScale.bodySmall,
    color: colors.text2,
    fontStyle: "italic",
  },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: typeScale.bodySmall,
    fontWeight: "600",
    color: colors.text0,
    flex: 1,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
  },
  typeRow: { flexDirection: "row", gap: spacing.sm },
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
  catText: {
    fontSize: typeScale.captionLarge,
    fontWeight: "500",
    color: colors.text1,
  },
  catTextActive: { color: colors.white, fontWeight: "600" },
  formRow: { flexDirection: "row", gap: spacing.md },
  fieldLabel: { ...typography.overline, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    color: colors.text0,
    fontSize: typeScale.bodyMedium,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  intervalRow: { flexDirection: "row", gap: spacing.sm },
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
  intervalChipText: {
    fontSize: typeScale.bodySmall,
    fontWeight: "500",
    color: colors.text1,
  },
  intervalChipTextActive: { color: colors.accentText, fontWeight: "600" },
  notesInput: {
    height: 66,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
  },
});
