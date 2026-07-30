import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { Vehicle } from "../../../domain/entities/Vehicle";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { formatOdometer, formatVehicleName } from "../../../utils/format";
import { vehicleTypeIcon } from "../../../utils/vehicleType";
import EncryptedImage from "@/screens/components/EncryptedImage";
import VehicleNavGrid, { VehicleNavScreen } from "./VehicleNavGrid";

interface Props {
  vehicle: Vehicle;
  width: number;
  serviceCount: number;
  lastServiceDate: string | null;
  totalFuelLiters: number;
  totalOtherCost: number;
  onEdit: () => void;
  onNavigate: (screen: VehicleNavScreen) => void;
}

export default function VehicleGarageCard({
  vehicle,
  width,
  serviceCount,
  lastServiceDate,
  totalFuelLiters,
  totalOtherCost,
  onEdit,
  onNavigate,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.page, { width }]}>
      <View style={styles.card}>
        <TouchableOpacity onPress={onEdit} hitSlop={10} style={styles.editBtn}>
          <Icon name="pen" size={13} color={colors.text1} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.imageWrap}>
            {vehicle.photoPath ? (
              <EncryptedImage path={vehicle.photoPath} style={styles.image} />
            ) : (
              <View style={styles.motoIcon}>
                <Icon
                  name={vehicleTypeIcon(vehicle.vehicleType)}
                  size={44}
                  color={colors.accentBright}
                />
              </View>
            )}
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)}
          </Text>

          <View style={styles.odoPill}>
            <Icon name="tachometer-alt" size={12} color={colors.accentBright} />
            <Text style={styles.odo}>
              {formatOdometer(vehicle.currentOdometer)}
            </Text>
          </View>
          {lastServiceDate ? (
            <Text style={styles.sub}>
              {t("vehicles.lastService")} · {lastServiceDate}
            </Text>
          ) : null}
        </View>

        <VehicleNavGrid
          totalServices={serviceCount}
          totalFuelLiters={totalFuelLiters}
          totalOtherCost={totalOtherCost}
          onNavigate={onNavigate}
        />
      </View>
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
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: "space-between",
    shadowColor: colors.cardGlowStrong,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  editBtn: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border1,
    zIndex: 5,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  imageWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorderStrong,
    backgroundColor: colors.bg2,
    shadowColor: colors.cardGlowStrong,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  image: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: colors.bg2,
  },
  motoIcon: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    marginTop: spacing.sm,
    ...typography.heroTitle,
    fontWeight: "900",
    color: colors.text0,
    textAlign: "center",
  },
  odoPill: {
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.cardBorderStrong,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  odo: {
    ...typography.numeric,
    fontWeight: "800",
    color: colors.accentText,
  },
  sub: { ...typography.labelSmall, color: colors.text2 },
});
