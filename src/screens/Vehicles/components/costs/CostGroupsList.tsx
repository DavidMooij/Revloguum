import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
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
  onDocuments: (cost: VehicleCost) => void;
}

export default function CostGroupsList({
  entries,
  paymentTypes,
  onEdit,
  onDeleteRequest,
  onDocuments,
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
          <View key={item.id} style={styles.costRow}>
            <TouchableOpacity
              style={styles.costContent}
              onPress={() => onEdit(item)}
              onLongPress={() => {
                haptic.error();
                onDeleteRequest(item.id);
              }}
              activeOpacity={0.78}
            >
              <View style={styles.iconWrap}>
              <Icon
                name={categoryIcon as any}
                size={13}
                color={colors.accent}
              />
              </View>

              <View style={styles.costLeft}>
              <Text style={styles.categoryText} numberOfLines={1}>
                {categoryLabel}
              </Text>

              <Text style={styles.dateText} numberOfLines={1}>
                {formatDate(item.dateTs)}
              </Text>

              {item.paymentIntervalId && (
                <Text style={styles.intervalText} numberOfLines={1}>
                  {t("payments.recurringPaidShort")}
                </Text>
              )}
              </View>

              <View style={styles.costRight}>
              <Text style={styles.costAmount} numberOfLines={1}>
                {formatCost(item.amount)}
              </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.documentButton}
              onPress={() => onDocuments(item)}
              hitSlop={8}
            >
              <Icon name="file-alt" size={13} color={colors.accent} />
            </TouchableOpacity>
          </View>
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
  costContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
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
  categoryText: {
    ...typography.bodyStrong,
    color: colors.text0,
  },
  dateText: {
    fontSize: typeScale.captionLarge,
    color: colors.text2,
    fontWeight: "500",
  },
  intervalText: {
    fontSize: typeScale.overline,
    fontWeight: "700",
    color: colors.accentText,
    textTransform: "uppercase",
    marginTop: 2,
  },
  costRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
  },
  costAmount: {
    fontSize: typeScale.bodyLarge,
    fontWeight: "800",
    color: colors.successText,
  },
  documentButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
});
