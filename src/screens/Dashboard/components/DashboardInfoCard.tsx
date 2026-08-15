import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { typography, typeScale } from "../../../theme/typography";

interface Props {
  label: string;
  title: string;
  subtitle?: string;
  icon: string;
  value?: string;
  variant?: "normal" | "warning";
  onPress: () => void;
}

export default function DashboardInfoCard({
  label,
  title,
  subtitle,
  icon,
  value,
  variant = "normal",
  onPress,
}: Props) {
  const isWarning = variant === "warning";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.accentBar,
          { backgroundColor: isWarning ? colors.warning : colors.accent },
        ]}
      />
      <View style={styles.top}>
        <View
          style={[
            styles.iconWrap,
            isWarning && { backgroundColor: colors.warningMuted },
          ]}
        >
          <Icon name={icon} size={16} color={isWarning ? colors.warning : colors.accent} />
        </View>

        {value && (
          <Text style={[styles.value, isWarning && { color: colors.warningText }]}>
            {value}
          </Text>
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && (
        <Text style={[styles.status, isWarning && { color: colors.warningText }]}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 140,
    backgroundColor: colors.bg1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.md,
    overflow: "hidden",
  },

  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  value: {
    fontSize: typeScale.body,
    fontWeight: "800",
    color: colors.accent,
  },

  label: {
    marginTop: spacing.sm,
    ...typography.overline,
    letterSpacing: 0.6,
  },

  title: {
    marginTop: 4,
    fontSize: typeScale.body,
    fontWeight: "700",
    color: colors.text0,
  },

  status: {
    marginTop: 5,
    fontSize: typeScale.captionLarge,
    color: colors.text2,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.accent,
  },
});
