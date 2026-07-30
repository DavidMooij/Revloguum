import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { typography, typeScale } from "../../../theme/typography";
import { formatCost, formatOdometer } from "../../../utils/format";
import { formatDateRelative } from "../../../utils/date";
import type { FuelEntry } from "../../../domain/entities/FuelEntry";

interface Props {
  entry: FuelEntry | null;
  onPress: () => void;
  t: any;
}

export default function LastFuelCard({
  entry,
  onPress,
  t,
}: Props) {

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon
            name="gas-pump"
            size={13}
            color={colors.accent}
          />

          <Text style={styles.title}>
            {t("dashboard.lastFuel")}
          </Text>
        </View>

        <Icon
          name="chevron-right"
          size={12}
          color={colors.text3}
        />
      </View>


      {!entry ? (
        <Text style={styles.empty}>
          {t("dashboard.noFuel")}
        </Text>
      ) : (

        <>

        <View style={styles.mainRow}>

          <View>
            <Text style={styles.big}>
              {entry.liters.toFixed(1)} L
            </Text>

            <Text style={styles.sub}>
              {formatDateRelative(entry.dateTs)}
            </Text>
          </View>


          <View style={styles.price}>
            <Text style={styles.money}>
              {formatCost(entry.cost)}
            </Text>

            <Text style={styles.sub}>
              {formatCost(entry.cost / entry.liters)}/L
            </Text>
          </View>

        </View>
       
        </>
      )}

    </TouchableOpacity>
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  title: {
    ...typography.overline,
  },

  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  big: {
    fontSize: typeScale.titleXL,
    fontWeight: "800",
    color: colors.text0,
  },

  money: {
    fontSize: typeScale.titleSmall,
    fontWeight: "700",
    color: colors.successText,
    textAlign: "right",
  },

  price: {
    alignItems: "flex-end",
  },

  sub: {
    fontSize: typeScale.captionLarge,
    color: colors.text2,
    marginTop: 2,
  },

  empty: {
    color: colors.text2,
    fontSize: typeScale.bodySmall,
  },
});