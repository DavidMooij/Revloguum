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
import { ServiceType } from "@/domain/entities/ServiceType";
import { ServiceInterval } from "@/domain/entities/Vehicle";
import { colors, radius, spacing } from "@/theme";
import { typography, typeScale } from "@/theme/typography";
import { useServiceTypeLabel } from "@/hooks/useServiceTypeLabel";

interface Props {
  serviceTypes: ServiceType[];
  intervals: ServiceInterval[];
  onChange: (intervals: ServiceInterval[]) => void;
}

export default function ServiceIntervalConfig({
  serviceTypes,
  intervals,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();

  const usedIds = new Set(intervals.map((i) => i.serviceTypeId));
  const firstAvailable = serviceTypes.find((st) => !usedIds.has(st.id));

  const handleAdd = () => {
    if (!firstAvailable) return;
    onChange([
      {
        serviceTypeId: firstAvailable.id,
        intervalKm: undefined,
        intervalDays: undefined,
      },
      ...intervals,
    ]);
  };

  const updateAt = (index: number, patch: Partial<ServiceInterval>) => {
    onChange(
      intervals.map((iv, i) => (i === index ? { ...iv, ...patch } : iv)),
    );
  };

  const removeAt = (index: number) => {
    onChange(intervals.filter((_, i) => i !== index));
  };

  const getTypeName = (id: string) => {
    const st = serviceTypes.find((s) => s.id === id);
    return st ? getLabel(st) : id;
  };
  const getTypeIcon = (id: string) =>
    serviceTypes.find((s) => s.id === id)?.icon ?? "wrench";

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>{t("vehicles.serviceIntervalsHint")}</Text>
      <TouchableOpacity
        style={[styles.addBox, !firstAvailable && styles.addBoxDisabled]}
        onPress={handleAdd}
        disabled={!firstAvailable}
      >
        <Icon name="plus" size={14} color={colors.accent} />
      </TouchableOpacity>

      {intervals.length === 0 && (
        <Text style={styles.empty}>{t("vehicles.noIntervals")}</Text>
      )}

      {intervals.map((iv, index) => (
        <View key={index} style={styles.intervalCard}>
          <View style={styles.cardTop}>
            <View style={styles.intervalIcon}>
              <Icon
                name={getTypeIcon(iv.serviceTypeId)}
                size={13}
                color={colors.accent}
              />
            </View>
            <Text style={styles.intervalName}>
              {getTypeName(iv.serviceTypeId)}
            </Text>
            <TouchableOpacity
              onPress={() => removeAt(index)}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <Icon name="times" size={14} color={colors.text2} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeRow}>
              {serviceTypes.map((st) => {
                const active = iv.serviceTypeId === st.id;
                const usedElsewhere = intervals.some(
                  (o, oi) => oi !== index && o.serviceTypeId === st.id,
                );
                return (
                  <TouchableOpacity
                    key={st.id}
                    disabled={usedElsewhere}
                    style={[
                      styles.typeChip,
                      active && styles.typeChipActive,
                      usedElsewhere && styles.typeChipDisabled,
                    ]}
                    onPress={() => updateAt(index, { serviceTypeId: st.id })}
                  >
                    <Icon
                      name={st.icon}
                      size={11}
                      color={active ? colors.white : colors.text2}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        active && styles.typeChipTextActive,
                      ]}
                    >
                      {getLabel(st)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>
                {t("vehicles.intervalKmLabel")}
              </Text>
              <TextInput
                style={styles.input}
                value={iv.intervalKm != null ? String(iv.intervalKm) : ""}
                onChangeText={(txt) =>
                  updateAt(index, {
                    intervalKm: txt ? parseInt(txt, 10) : undefined,
                  })
                }
                keyboardType="numeric"
                placeholder={t("vehicles.placeholderIntervalKm")}
                placeholderTextColor={colors.text2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>
                {t("vehicles.intervalDaysLabel")}
              </Text>
              <TextInput
                style={styles.input}
                value={iv.intervalDays != null ? String(iv.intervalDays) : ""}
                onChangeText={(txt) =>
                  updateAt(index, {
                    intervalDays: txt ? parseInt(txt, 10) : undefined,
                  })
                }
                keyboardType="numeric"
                placeholder={t("vehicles.placeholderIntervalDays")}
                placeholderTextColor={colors.text2}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  addBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addBoxDisabled: { opacity: 0.4 },
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
  intervalCard: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  intervalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  intervalName: {
    flex: 1,
    fontSize: typeScale.bodySmall,
    fontWeight: "600",
    color: colors.text0,
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
  typeChip: {
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
  typeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDark,
  },
  typeChipDisabled: { opacity: 0.35 },
  typeChipText: {
    fontSize: typeScale.captionLarge,
    fontWeight: "500",
    color: colors.text1,
  },
  typeChipTextActive: { color: colors.white, fontWeight: "600" },
  fieldLabel: { ...typography.overline, marginBottom: spacing.xs },
  formRow: { flexDirection: "row", gap: spacing.md },
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
});
