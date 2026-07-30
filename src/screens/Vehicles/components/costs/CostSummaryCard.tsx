import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../../../theme/colors";
import { spacing, radius } from "../../../../theme/spacing";
import { typography } from "../../../../theme/typography";
import { formatCost } from "../../../../utils/format";

interface Props {
  totalCost: number;
  monthlyEstimate: number;
  totalLabel: string;
  monthlyLabel: string;
}

export default function CostSummaryCard({
  totalCost,
  monthlyEstimate,
  totalLabel,
  monthlyLabel,
}: Props) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryBlock}>
        <Text style={styles.summaryLabel}>{totalLabel}</Text>
        <Text style={styles.summaryValue}>{formatCost(totalCost)}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryBlock}>
        <Text style={styles.summaryLabel}>{monthlyLabel}</Text>
        <Text style={styles.summaryValue}>{formatCost(monthlyEstimate)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    ...typography.overline,
    letterSpacing: 1,
  },
  summaryValue: {
    marginTop: 5,
    ...typography.h2,
    fontWeight: "800",
    color: colors.text0,
  },
});
