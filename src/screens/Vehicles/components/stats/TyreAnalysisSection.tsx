import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../../theme/colors";
import { spacing, radius } from "../../../../theme/spacing";
import { typography, typeScale } from "../../../../theme/typography";
import { formatOdometer } from "../../../../utils/format";
import { formatDate } from "../../../../utils/date";
import type { TyreDataPoint } from "../../../../hooks/useVehicleStats";

interface Props {
  data: TyreDataPoint[];
}

export default function TyreAnalysisSection({ data }: Props) {
  const { t } = useTranslation();

  const intervals = data
    .map((d) => d.kmSincePrev)
    .filter((v): v is number => v != null && v > 0);
  const avgLife =
    intervals.length > 0
      ? intervals.reduce((s, v) => s + v, 0) / intervals.length
      : null;

  const ordered = [...data].reverse();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Icon name="circle-notch" size={13} color={colors.accent} />
        </View>
        <Text style={styles.sectionLabel}>{t("stats.tyreSection")}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{data.length}</Text>
          <Text style={styles.summaryLabel}>{t("stats.tyreChangeCount")}</Text>
        </View>
        <View style={styles.summaryDiv} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {avgLife != null ? formatOdometer(Math.round(avgLife)) : "-"}
          </Text>
          <Text style={styles.summaryLabel}>{t("stats.avgTyreLife")}</Text>
        </View>
      </View>

      {ordered.map((d, i) => (
        <View key={`${d.dateTs}-${d.odometerKm}-${i}`} style={styles.entry}>
          <View style={styles.entryTop}>
            <Text style={styles.entryOdo}>{formatOdometer(d.odometerKm)}</Text>
            {d.kmSincePrev != null ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {t("stats.tyreSincePrev", {
                    km: d.kmSincePrev.toLocaleString(),
                  })}
                </Text>
              </View>
            ) : (
              <View style={styles.badgeMuted}>
                <Text style={styles.badgeMutedText}>
                  {t("stats.tyreFirstRecord")}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.entryDate}>{formatDate(d.dateTs)}</Text>
          {d.notes ? <Text style={styles.entryNotes}>{d.notes}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    ...typography.overline,
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryDiv: { width: 1, backgroundColor: colors.border0 },
  summaryValue: {
    ...typography.bodyStrong,
    fontWeight: "700",
    color: colors.text0,
  },
  summaryLabel: {
    fontSize: typeScale.overline,
    color: colors.text2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  entry: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: 4,
  },
  entryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryOdo: { ...typography.bodyStrong, fontWeight: "700", color: colors.text0 },
  badge: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: typeScale.caption, fontWeight: "600", color: colors.accentText },
  badgeMuted: {
    backgroundColor: colors.bg3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeMutedText: { fontSize: typeScale.caption, color: colors.text2 },
  entryDate: { fontSize: typeScale.captionLarge, color: colors.text2 },
  entryNotes: { fontSize: typeScale.captionLarge, color: colors.text1, fontStyle: "italic" },
});
