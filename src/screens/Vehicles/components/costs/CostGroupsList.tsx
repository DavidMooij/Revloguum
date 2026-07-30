import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../../../../theme/colors";
import { spacing, radius } from "../../../../theme/spacing";
import { typeScale } from "../../../../theme/typography";
import type { CostCategory, VehicleCost } from "../../../../domain/entities/VehicleCost";
import { formatCost } from "../../../../utils/format";
import { formatDate } from "../../../../utils/date";
import { haptic } from "@/utils/haptics";

export interface CostGroupView {
  key: CostCategory;
  icon: string;
  items: VehicleCost[];
  total: number;
}

interface Props {
  groups: CostGroupView[];
  onEdit: (cost: VehicleCost) => void;
  onDeleteRequest: (costId: string) => void;
}

export default function CostGroupsList({ groups, onEdit, onDeleteRequest }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <View style={styles.groupHeader}>
            <View style={styles.groupIconWrap}>
              <Icon name={group.icon} size={13} color={colors.accent} />
            </View>
            <Text style={styles.groupTitle}>{t(`costs.categories.${group.key}`)}</Text>
            <Text style={styles.groupTotal}>{formatCost(group.total)}</Text>
          </View>
          {group.items.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.costRow,
                idx < group.items.length - 1 && styles.costRowBorder,
              ]}
              onPress={() => onEdit(item)}
              onLongPress={() => {
                haptic.error();
                onDeleteRequest(item.id);
              }}
              activeOpacity={0.72}
            >
              <View style={styles.costLeft}>
                <Text style={styles.costAmount}>{formatCost(item.amount)}</Text>
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
                <Text style={styles.costDate}>{formatDate(item.dateTs)}</Text>
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
  );
}

const styles = StyleSheet.create({
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
  groupTitle: {
    flex: 1,
    fontSize: typeScale.bodySmall,
    fontWeight: "600",
    color: colors.text0,
  },
  groupTotal: { fontSize: typeScale.bodySmall, fontWeight: "600", color: colors.text0 },
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
  costAmount: { fontSize: typeScale.body, fontWeight: "600", color: colors.text0 },
  intervalBadge: {
    backgroundColor: colors.bg3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  intervalText: { fontSize: typeScale.overline, fontWeight: "600", color: colors.text2 },
  costRight: { flex: 1, alignItems: "flex-end" },
  costDate: { fontSize: typeScale.captionLarge, color: colors.text2 },
  costNotes: {
    fontSize: typeScale.caption,
    color: colors.text2,
    fontStyle: "italic",
    maxWidth: 140,
  },
});
