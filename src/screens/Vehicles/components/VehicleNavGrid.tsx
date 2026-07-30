import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { formatCost } from "../../../utils/format";

export type VehicleNavScreen =
  | "VehicleHistory"
  | "VehicleFuelHistory"
  | "VehicleCosts"
  | "VehicleStats";

interface Props {
  totalServices: number;
  totalFuelLiters: number;
  totalOtherCost: number;
  onNavigate: (screen: VehicleNavScreen) => void;
}

const BLUE = "#60A5FA";
const BLUE_MUTED = "rgba(96,165,250,0.12)";

export default function VehicleNavGrid({
  totalServices,
  totalFuelLiters,
  totalOtherCost,
  onNavigate,
}: Props) {
  const { t } = useTranslation();

  const tiles: {
    label: string;
    value: string;
    icon: string;
    screen: VehicleNavScreen;
    tint: string;
    tintMuted: string;
  }[] = [
    {
      label: t("vehicles.services"),
      value: String(totalServices),
      icon: "tools",
      screen: "VehicleHistory",
      tint: colors.accentBright,
      tintMuted: colors.accentMuted,
    },
    {
      label: t("vehicles.fuelHistory"),
      value: `${totalFuelLiters.toFixed(0)} L`,
      icon: "gas-pump",
      screen: "VehicleFuelHistory",
      tint: BLUE,
      tintMuted: BLUE_MUTED,
    },
    {
      label: t("costs.title"),
      value: formatCost(totalOtherCost),
      icon: "receipt",
      screen: "VehicleCosts",
      tint: colors.warningText,
      tintMuted: colors.warningMuted,
    },
    {
      label: t("stats.title"),
      value: t("vehicles.analytics"),
      icon: "chart-line",
      screen: "VehicleStats",
      tint: colors.successText,
      tintMuted: colors.successMuted,
    },
  ];

  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <TouchableOpacity
          key={tile.screen}
          style={styles.tile}
          onPress={() => onNavigate(tile.screen)}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBadge, { backgroundColor: tile.tintMuted }]}>
            <Icon name={tile.icon} size={17} color={tile.tint} />
          </View>
          <View style={styles.tileText}>
            <Text style={styles.value} numberOfLines={1}>
              {tile.value}
            </Text>
            <Text style={styles.label} numberOfLines={1}>
              {tile.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.bg2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: { gap: 2 },
  value: {
    ...typography.titleCard,
    fontWeight: "800",
    color: colors.text0,
  },
  label: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.text2,
  },
});

