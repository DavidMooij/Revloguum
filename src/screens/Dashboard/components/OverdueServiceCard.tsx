import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { spacing, radius } from "../../../theme/spacing";
import { typography, typeScale } from "../../../theme/typography";
import type { OverdueItem } from "../DashboardScreen";
import { useServiceTypeLabel } from "../../../hooks/useServiceTypeLabel";

interface Props {
  item: OverdueItem | null;
  onPress: () => void;
  t: any;
}

export default function OverdueServiceCard({ item, onPress, t }: Props) {
  const getLabel = useServiceTypeLabel();
  const hasOverdue = !!item;

  let status = "";

  if (hasOverdue) {
    if (item.neverDone) {
      status = t("dashboard.neverDone");
    } else {
      if (item.kmOverdue !== null && item.kmOverdue > 0) {
        status += `+${item.kmOverdue.toLocaleString()} km ${t(
          "dashboard.overdue",
        )}`;
      }

      if (item.daysOverdue !== null && item.daysOverdue > 0) {
        if (status) status += " · ";
        status += `+${item.daysOverdue} ${t("dashboard.daysOverdue")}`;
      }
    }
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={hasOverdue ? onPress : undefined}
      activeOpacity={hasOverdue ? 0.8 : 1}
    >
      <View
        style={[
          styles.accentBar,
          {
            backgroundColor: hasOverdue ? colors.warning : colors.success,
          },
        ]}
      />

      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: hasOverdue
              ? colors.warningMuted
              : colors.successMuted,
          },
        ]}
      >
        <Icon
          name={hasOverdue ? "exclamation-triangle" : "check-circle"}
          size={16}
          color={hasOverdue ? colors.warning : colors.success}
        />
      </View>

      <View style={styles.content}>
        {hasOverdue && (
          <Text
            style={[
              styles.label,
              {
                color: hasOverdue ? colors.warningText : colors.success,
              },
            ]}
          >
            {t("dashboard.overdueService")}
          </Text>
        )}

        <Text style={styles.title}>
          {hasOverdue
            ? getLabel({ name: item.serviceTypeName, translationKey: item.translationKey })
            : t("dashboard.noOverdueServices")}
        </Text>

        <Text
          style={[
            styles.status,
            {
              color: hasOverdue ? colors.warningText : colors.success,
            },
          ]}
        >
          {hasOverdue ? status : t("dashboard.vehicleUpToDate")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: spacing.md,
    overflow: "hidden",
    height: 75,
  },

  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.warning,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(232,162,40,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },

  content: {
    flex: 1,
    gap: 3,
  },

  label: {
    ...typography.overline,
    color: colors.warningText,
    letterSpacing: 0.6,
  },

  title: {
    fontSize: typeScale.bodyLarge,
    fontWeight: "700",
    color: colors.text0,
  },

  status: {
    fontSize: typeScale.captionLarge,
    fontWeight: "600",
    color: colors.warningText,
  },
});
