import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { typography, typeScale } from "../../../theme/typography";

interface Props {
  width: number;
  hasVehicles: boolean;
  onPress: () => void;
}

export default function AddVehicleCard({ width, hasVehicles, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.page, { width }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.plusRing}>
          <View style={styles.plusInner}>
            <Icon name="plus" size={30} color={colors.accentBright} />
          </View>
        </View>
        <Text style={styles.title}>{t("vehicles.addVehicle")}</Text>
        <Text style={styles.subtitle}>
          {hasVehicles
            ? t("vehicles.addAnotherVehicle")
            : t("vehicles.addFirstVehicle")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    height: "100%",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.bg1,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  plusRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorderStrong,
    backgroundColor: colors.bg2,
  },
  plusInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: spacing.sm,
    ...typography.h2,
    fontWeight: "800",
    color: colors.text0,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typeScale.bodySmall,
    color: colors.text2,
    textAlign: "center",
  },
});
