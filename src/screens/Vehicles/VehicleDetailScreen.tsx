import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import { getDatabase } from "../../data/db/database";
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import { SQLiteServiceEntryRepo } from "../../data/repositories/SQLiteServiceEntryRepo";
import { SQLiteFuelRepo } from "../../data/repositories/SQLiteFuelRepo";
import { SQLiteVehicleCostRepo } from "../../data/repositories/SQLiteVehicleCostRepo";
import type { Vehicle } from "../../domain/entities/Vehicle";
import {
  formatOdometer,
  formatCost,
  formatVehicleName,
} from "../../utils/format";
import { formatDate } from "../../utils/date";
import ScreenHeader from "../components/ScreenHeader";
import { vehicleTypeIcon } from "@/utils/vehicleType";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VehicleDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;

  const [vehicle, setvehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState({
    totalServices: 0,
    lastServiceDate: null as string | null,
    totalFuelCost: 0,
    totalOtherCost: 0,
    totalFuelLiters: 0,
  });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const db = await getDatabase();
        const [m, count, lastEntry, fuelStats, otherCost] = await Promise.all([
          new SQLiteVehicleRepo(db).getById(vehicleId),
          new SQLiteServiceEntryRepo(db).getCountForVehicle(vehicleId),
          new SQLiteServiceEntryRepo(db).getLastForVehicle(vehicleId),
          new SQLiteFuelRepo(db).getStats({ vehicleId }),
          new SQLiteVehicleCostRepo(db).getTotalCost(vehicleId),
        ]);
        setvehicle(m);
        setStats({
          totalServices: count,
          lastServiceDate: lastEntry ? formatDate(lastEntry.dateTs) : null,
          totalFuelCost: fuelStats.totalCost,
          totalOtherCost: otherCost,
          totalFuelLiters: fuelStats.totalLiters,
        });
      })();
    }, [vehicleId]),
  );

  if (!vehicle) return null;

  const navItems = [
    {
      label: t('history.title'),
      icon: "history",
      screen: "VehicleHistory" as const,
      sub: `${stats.totalServices} ${t('costs.serviceEntries').toLowerCase()}`,
    },
    {
      label: t('vehicles.fuel'),
      icon: "gas-pump",
      screen: "VehicleFuelHistory" as const,
      sub: `${stats.totalFuelLiters.toFixed(0)} L total`,
    },
    {
      label: t('costs.title'),
      icon: "receipt",
      screen: "VehicleCosts" as const,
      sub: formatCost(stats.totalOtherCost),
    },
    {
      label: t('stats.title'),
      icon: "chart-bar",
      screen: "VehicleStats" as const,
      sub: t('vehicles.costAndConsumption'),
    },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)}
        showBack
        rightElement={
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("AddVehicle", { editId: vehicle.id })
            }
            hitSlop={8}
          >
            <Icon name="pen" size={15} color={colors.text1} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {vehicle.photoPath ? (
            <Image source={{ uri: vehicle.photoPath }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Icon name={vehicleTypeIcon(vehicle.vehicleType)} size={48} color={colors.text2} />
            </View>
          )}
          <Text style={styles.heroName}>
            {formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)}
          </Text>
          {vehicle.year ? <Text style={styles.heroYear}>{vehicle.year}</Text> : null}
          <Text style={styles.heroOdo}>
            {formatOdometer(vehicle.currentOdometer)}
          </Text>
          {stats.lastServiceDate && (
            <Text style={styles.heroSub}>
              Letzter Service: {stats.lastServiceDate}
            </Text>
          )}
        </View>

        <View style={styles.navGrid}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.navCard}
              onPress={() => navigation.navigate(item.screen, { vehicleId })}
              activeOpacity={0.75}
            >
              <View style={styles.navIcon}>
                <Icon name={item.icon} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.navLabel}>{item.label}</Text>
                <Text style={styles.navSub}>{item.sub}</Text>
              </View>
              <Icon name="chevron-right" size={11} color={colors.text3} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, paddingBottom: 60, gap: spacing.md },
  hero: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.sm,
  },
  heroPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text0,
    letterSpacing: -0.3,
  },
  heroYear: { fontSize: 14, color: colors.text2 },
  heroOdo: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: -0.5,
  },
  heroSub: { fontSize: 13, color: colors.text2 },
  navGrid: { gap: spacing.sm },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    padding: spacing.md,
    gap: spacing.md,
  },
  navIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navLabel: { fontSize: 15, fontWeight: "600", color: colors.text0 },
  navSub: { fontSize: 12, color: colors.text2, marginTop: 2 },
});
