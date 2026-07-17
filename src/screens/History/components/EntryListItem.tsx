import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { ServiceEntryWithDetails } from "../../../domain/entities/ServiceEntry";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { formatDate } from "../../../utils/date";
import {
  formatOdometer,
  formatCost,
  truncateNotes,
} from "../../../utils/format";

interface Props {
  entry: ServiceEntryWithDetails;
  onPress: () => void;
  onLongPress?: () => void;
  showNotes?: boolean;
}

export default function EntryListItem({ entry, onPress, onLongPress, showNotes = true }: Props) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.65}
    >
      <View style={styles.iconWrap}>
        <Icon name={entry.serviceTypeIcon} size={14} color={colors.accent} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.typeName} numberOfLines={1}>
            {entry.serviceTypeName}
          </Text>
          {entry.cost != null && (
            <Text style={styles.cost}>{formatCost(entry.cost)}</Text>
          )}
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatDate(entry.dateTs)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{formatOdometer(entry.odometerKm)}</Text>
        </View>
        {showNotes && entry.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {truncateNotes(entry.notes)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: { flex: 1, gap: 3 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeName: { fontSize: 14, fontWeight: "500", color: colors.text0, flex: 1 },
  cost: {
    fontSize: 13,
    color: colors.successText,
    marginLeft: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: colors.text2 },
  metaDot: { fontSize: 12, color: colors.text3 },
  notes: { fontSize: 12, color: colors.text2, fontStyle: "italic" },
});

