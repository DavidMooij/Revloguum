import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { getDatabase } from "../../data/db/database";
import { SQLiteDocumentRepo } from "../../data/repositories/SQLiteDocumentRepo";
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import { SQLiteVehicleCostRepo } from "../../data/repositories/SQLiteVehicleCostRepo";
import type { Vehicle } from "../../domain/entities/Vehicle";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { typeScale } from "../../theme/typography";
import { formatVehicleName } from "../../utils/format";
import ScreenHeader from "../components/ScreenHeader";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleManagement">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ManagementItemProps {
  icon: string;
  title: string;
  subtitle: string;
  count: number;
  tint: string;
  tintMuted: string;
  onPress: () => void;
}

export default function VehicleManagementScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [counts, setCounts] = useState({
    services: 0,
    payments: 0,
    documents: 0,
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        const db = await getDatabase();
        const [loadedVehicle, paymentIntervals, documents] = await Promise.all([
          new SQLiteVehicleRepo(db).getById(vehicleId),
          new SQLiteVehicleCostRepo(db).getIntervals(vehicleId),
          new SQLiteDocumentRepo(db).getForOwner("vehicle", vehicleId),
        ]);
        if (!active) return;
        setVehicle(loadedVehicle);
        setCounts({
          services: loadedVehicle?.serviceIntervals.length ?? 0,
          payments: paymentIntervals.length,
          documents: documents.length,
        });
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [vehicleId]),
  );

  const vehicleName = vehicle
    ? formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)
    : "";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("vehicles.managementTitle")}
        subtitle={vehicleName}
        showBack
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.menu}>
            <ManagementItem
              icon="bell"
              title={t("vehicles.serviceIntervals")}
              subtitle={t("vehicles.serviceIntervalsNavHint")}
              count={counts.services}
              tint={colors.accentBright}
              tintMuted={colors.accentMuted}
              onPress={() =>
                navigation.navigate("VehicleServiceIntervals", { vehicleId })
              }
            />
            <ManagementItem
              icon="receipt"
              title={t("vehicles.paymentIntervals")}
              subtitle={t("vehicles.paymentIntervalsNavHint")}
              count={counts.payments}
              tint={colors.warningText}
              tintMuted={colors.warningMuted}
              onPress={() =>
                navigation.navigate("VehiclePaymentIntervals", { vehicleId })
              }
            />
            <ManagementItem
              icon="file-alt"
              title={t("documents.vehicleTitle")}
              subtitle={t("vehicles.documentsNavHint")}
              count={counts.documents}
              tint={colors.successText}
              tintMuted={colors.successMuted}
              onPress={() =>
                navigation.navigate("Documents", {
                  vehicleId,
                  ownerType: "vehicle",
                  ownerId: vehicleId,
                  title: t("documents.vehicleTitle"),
                })
              }
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function ManagementItem({
  icon,
  title,
  subtitle,
  count,
  tint,
  tintMuted,
  onPress,
}: ManagementItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={[styles.iconWrap, { backgroundColor: tintMuted }]}>
        <Icon name={icon} size={22} color={tint} />
      </View>
      <View style={styles.itemText}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.itemSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
      <Icon name="chevron-right" size={11} color={colors.text2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  menu: {
    gap: spacing.md,
  },
  menuItem: {
    minHeight: 104,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.bg1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemText: { flex: 1, minWidth: 0, gap: spacing.sm },
  itemTitle: {
    fontSize: typeScale.bodyLarge,
    fontWeight: "700",
    color: colors.text0,
  },
  itemSubtitle: {
    fontSize: typeScale.captionLarge,
    lineHeight: 17,
    color: colors.text2,
  },
  countBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: spacing.xs,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border1,
  },
  countText: {
    fontSize: typeScale.captionLarge,
    fontWeight: "700",
    color: colors.text1,
  },
});