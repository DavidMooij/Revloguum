import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../../../../theme/colors";
import { spacing, radius } from "../../../../theme/spacing";
import { typography, typeScale } from "../../../../theme/typography";
import { type VehicleCost } from "../../../../domain/entities/VehicleCost";
import type { PaymentType } from "@/domain/entities/PaymentType";
import { formatCost } from "../../../../utils/format";
import { formatDate } from "../../../../utils/date";
import { haptic } from "@/utils/haptics";
import { usePaymentTypeLabel } from "@/hooks/usePaymentTypeLabel";

interface Props {
  entries: VehicleCost[];
  paymentTypes: PaymentType[];
  onEdit: (cost: VehicleCost) => void;
  onDeleteRequest: (costId: string) => void;
}

export default function CostGroupsList({
  entries,
  paymentTypes,
  onEdit,
  onDeleteRequest,
}: Props) {
  const { t } = useTranslation();
  const getPaymentTypeLabel = usePaymentTypeLabel();
  const paymentTypeById = new Map(paymentTypes.map((pt) => [pt.id, pt]));

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {entries.map((item) => {
        const paymentType = paymentTypeById.get(item.category);
        const categoryIcon = paymentType?.icon ?? "receipt";
        const fallbackKey = `costs.categories.${item.category}`;
        const categoryLabel = paymentType
          ? getPaymentTypeLabel(paymentType)
          : (() => {
              const translated = t(fallbackKey);
              return translated === fallbackKey ? item.category : translated;
            })();

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.costRow}
            onPress={() => onEdit(item)}
            onLongPress={() => {
              haptic.error();
              onDeleteRequest(item.id);
            }}
            activeOpacity={0.78}
          >
            <View style={styles.iconWrap}>
              <Icon name={categoryIcon as any} size={13} color={colors.accent} />
            </View>

            <View style={styles.costLeft}>
              <View style={styles.titleLine}>
                <Text style={styles.categoryText} numberOfLines={1}>
                  {categoryLabel}
                </Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.dateText} numberOfLines={1}>
                  {formatDate(item.dateTs)}
                </Text>
                {item.paymentIntervalId && (
                  <View style={styles.intervalBadge}>
                    <Text style={styles.intervalText}>{t("payments.recurringPaidShort")}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.costRight}>
              <Text style={styles.costAmount} numberOfLines={1}>
                {formatCost(item.amount)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 60, gap: spacing.sm },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  costLeft: {
    flex: 1,
    minWidth: 0,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 20,
    flexWrap: "nowrap",
  },
  categoryText: {
    ...typography.bodyStrong,
    color: colors.text0,
  },
  dot: {
    fontSize: typeScale.captionLarge,
    color: colors.text3,
  },
  dateText: {
    fontSize: typeScale.captionLarge,
    color: colors.text2,
    fontWeight: "500",
  },
  intervalBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.accentMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  intervalText: {
    fontSize: typeScale.overline,
    fontWeight: "700",
    color: colors.accentText,
    textTransform: "uppercase",
  },
  costRight: { flex: 1, alignItems: "flex-end" },
  costAmount: {
    fontSize: typeScale.bodyLarge,
    fontWeight: "800",
    color: colors.successText,
  },
});
