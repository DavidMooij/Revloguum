import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { ServiceEntryGroup } from "../../../hooks/useServiceHistory";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { formatDate } from "../../../utils/date";
import {
  formatOdometer,
  formatCost,
  truncateNotes,
} from "../../../utils/format";
import { useServiceTypeLabel } from "../../../hooks/useServiceTypeLabel";
import EntryListItem from "./EntryListItem";

interface Props {
  group: ServiceEntryGroup;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function ServiceGroupCard({ group, onPress, onLongPress }: Props) {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();

  if (group.items.length === 1) {
    return (
      <EntryListItem
        entry={group.items[0]}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.65}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="layer-group" size={14} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {t("history.servicesCount", { count: group.items.length })}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{formatDate(group.dateTs)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>
              {formatOdometer(group.odometerKm)}
            </Text>
          </View>
        </View>
        {group.totalCost != null && (
          <Text style={styles.cost}>{formatCost(group.totalCost)}</Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.items}>
        {group.items.map((it) => (
          <View key={it.id} style={styles.itemRow}>
            <View style={styles.itemIcon}>
              <Icon name={it.serviceTypeIcon} size={11} color={colors.text1} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.itemTop}>
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {getLabel({
                    name: it.serviceTypeName,
                    translationKey: it.translationKey,
                  })}
                </Text>
                {it.cost != null && (
                  <Text style={styles.itemCost}>{formatCost(it.cost)}</Text>
                )}
              </View>
              {it.notes ? (
                <Text style={styles.itemNote} numberOfLines={1}>
                  {truncateNotes(it.notes)}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.text0 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 12, color: colors.text2 },
  metaDot: { fontSize: 12, color: colors.text3 },
  cost: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.successText,
    marginLeft: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border0,
    marginVertical: spacing.md,
  },
  items: { gap: spacing.sm },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  itemIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLabel: { fontSize: 13, fontWeight: "500", color: colors.text0, flex: 1 },
  itemCost: {
    fontSize: 12,
    color: colors.successText,
    marginLeft: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  itemNote: {
    fontSize: 12,
    color: colors.text2,
    fontStyle: "italic",
    marginTop: 1,
  },
});
