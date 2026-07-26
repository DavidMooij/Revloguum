import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { FontAwesome5, FontAwesome5 as Icon } from "@expo/vector-icons";
import type { Vehicle } from "../../../domain/entities/Vehicle";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/spacing";
import { formatOdometer, formatVehicleName } from "../../../utils/format";
import { vehicleTypeIcon } from "../../../utils/vehicleType";
import EncryptedImage from "@/screens/components/EncryptedImage";

interface Props {
  vehicle: Vehicle;
  onPress: () => void;
  onEdit: () => void;
  serviceCount: number;
  lastServiceDate: string | null;
}

export default function VehicleCard({
  vehicle,
  onPress,
  onEdit,
  serviceCount,
  lastServiceDate,
}: Props) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          onPress={onEdit}
          hitSlop={10}
          style={styles.actionBtn}
        >
          <Icon name="pen" size={14} color={colors.text2} />
        </TouchableOpacity>

        {vehicle.photoPath ? (
          <EncryptedImage path={vehicle.photoPath} style={styles.image} />
        ) : (
          <View style={styles.motoIcon}>
            <FontAwesome5
              name={vehicleTypeIcon(vehicle.vehicleType)}
              size={32}
              color={colors.accent}
            />
          </View>
        )}

        <Text style={styles.name} numberOfLines={1}>
          {formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)}
        </Text>

        {vehicle.year && <Text style={styles.year}>{vehicle.year}</Text>}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Icon name="tachometer-alt" size={12} color={colors.accent} />
          <Text style={styles.statValue}>
            {formatOdometer(vehicle.currentOdometer)}
          </Text>
          <Text style={styles.statLabel}>{t("vehicles.currentOdo")}</Text>
        </View>

        <View style={styles.statBox}>
          <Icon name="tools" size={12} color={colors.accent} />
          <Text style={styles.statValue}>{serviceCount}</Text>
          <Text style={styles.statLabel}>{t("vehicles.services")}</Text>
        </View>

        <View style={styles.statBox}>
          <Icon name="calendar-alt" size={12} color={colors.accent} />
          <Text style={styles.statValue} numberOfLines={1}>
            {lastServiceDate ?? "—"}
          </Text>
          <Text style={styles.statLabel}>{t("vehicles.lastService")}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,

    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 10,
  },

  cardHeader: {
    alignItems: "center",
    position: "relative",
    paddingTop: 6,
  },

  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.bg2,

    borderWidth: 4,
    borderColor: colors.bg1,
  },

  motoIcon: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",

    borderWidth: 4,
    borderColor: colors.bg1,
  },

  actionBtn: {
    position: "absolute",
    right: 0,
    top: 0,

    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor: colors.bg2,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: colors.border1,

    zIndex: 5,
  },

  name: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: "900",
    color: colors.text0,
    textAlign: "center",
    letterSpacing: -0.5,
  },

  year: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text2,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },

  statBox: {
    flex: 1,

    backgroundColor: colors.bg2,

    borderRadius: 18,

    paddingVertical: 12,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: colors.border0,
  },

  statValue: {
    marginTop: 6,

    fontSize: 15,
    fontWeight: "800",
    color: colors.text0,

    textAlign: "center",
  },

  statLabel: {
    marginTop: 3,

    fontSize: 9,
    fontWeight: "800",

    color: colors.text2,

    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
