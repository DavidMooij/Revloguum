import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";
import { typography, typeScale } from "@/theme/typography";

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accent?: boolean;
  style?: ViewStyle;
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  iconColor,
  trend,
  trendValue,
  accent,
  style,
}: Props) {
  const trendColor =
    trend === "up"
      ? colors.successText
      : trend === "down"
        ? colors.dangerText
        : colors.text2;
  const trendIcon =
    trend === "up" ? "arrow-up" : trend === "down" ? "arrow-down" : "minus";

  return (
    <View style={[styles.card, accent && styles.cardAccent, style]}>
      {icon && (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: accent ? "rgba(255,255,255,0.1)" : colors.bg3 },
          ]}
        >
          <Icon
            name={icon}
            size={14}
            color={iconColor ?? (accent ? colors.accent : colors.text2)}
          />
        </View>
      )}
      <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
      <Text
        style={[styles.value, accent && styles.valueAccent]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {sub && (
        <Text style={[styles.sub, accent && styles.subAccent]}>{sub}</Text>
      )}
      {trend && trendValue && (
        <View style={styles.trendRow}>
          <Icon name={trendIcon} size={9} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: 3,
    minWidth: "45%",
  },
  cardAccent: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  label: {
    ...typography.overline,
    letterSpacing: 0.5,
  },
  labelAccent: { color: colors.accentText },
  value: {
    ...typography.h2,
    color: colors.text0,
  },
  valueAccent: { color: colors.accent },
  sub: { fontSize: typeScale.caption, color: colors.text2 },
  subAccent: { color: colors.accentText, opacity: 0.7 },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  trendText: { fontSize: typeScale.caption, fontWeight: "600" },
});
