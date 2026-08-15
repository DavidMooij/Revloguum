import React, { useState } from "react";
import { haptic } from "../../../utils/haptics";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { Vehicle } from "../../../domain/entities/Vehicle";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { typeScale } from "../../../theme/typography";
import { formatVehicleName } from "../../../utils/format";
import { vehicleTypeIcon } from "../../../utils/vehicleType";
import EncryptedImage from "@/screens/components/EncryptedImage";

interface Props {
  vehicles: Vehicle[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function VehicleSelector({
  vehicles,
  activeId,
  onSelect,
}: Props) {
  if (vehicles.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {vehicles.map((vehicle) => {
        const active = vehicle.id === activeId;

        return (
          <TouchableOpacity
            key={vehicle.id}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => {
              haptic.selection();
              onSelect(vehicle.id);
            }}
            activeOpacity={0.85}
          >
            <View style={[styles.imageWrap, active && styles.imageWrapActive]}>
              {vehicle.photoPath ? (
                <EncryptedImage path={vehicle.photoPath} style={styles.image} />
              ) : (
                <Icon
                  name={vehicleTypeIcon(vehicle.vehicleType)}
                  size={20}
                  color={active ? colors.accent : colors.text2}
                />
              )}
            </View>

            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },

  card: {
    height: 75,
    minWidth: 210,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },

  cardActive: {
    backgroundColor: colors.bg2,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },

  imageWrap: {
    width: 55,
    height: 55,
    borderRadius: radius.full,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },

  imageWrapActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  label: {
    flex: 1,
    fontSize: typeScale.bodyMedium,
    fontWeight: "600",
    color: colors.text1,
    textAlign: "left",
  },

  labelActive: {
    color: colors.text0,
    fontWeight: "800",
  },
});
