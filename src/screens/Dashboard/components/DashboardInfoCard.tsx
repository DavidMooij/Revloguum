import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";

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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.accentBar} />
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={16} color={colors.accent} />
        </View>

        {value && <Text style={styles.value}>{value}</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.status}>{subtitle}</Text>}
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
    padding: spacing.md,
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
    fontSize: 15,
    fontWeight: "800",
    color: colors.accent,
  },

  label: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.6,
  },

  title: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text0,
  },

  status: {
    marginTop: 5,
    fontSize: 12,
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
