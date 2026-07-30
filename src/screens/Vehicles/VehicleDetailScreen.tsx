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
  formatVehicleName,
} from "../../utils/format";
import { formatDate } from "../../utils/date";
import ScreenHeader from "../components/ScreenHeader";
import { vehicleTypeIcon } from "@/utils/vehicleType";
import EncryptedImage from "../components/EncryptedImage";
import VehicleNavGrid from "./components/VehicleNavGrid";

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
      <View style={styles.body}>
        <View style={styles.hero}>
          {vehicle.photoPath ? (
            <EncryptedImage path={vehicle.photoPath} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Icon
                name={vehicleTypeIcon(vehicle.vehicleType)}
                size={48}
                color={colors.text2}
              />
            </View>
          )}
          <Text style={styles.heroName}>
            {formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)}
          </Text>
          {vehicle.year ? (
            <Text style={styles.heroYear}>{vehicle.year}</Text>
          ) : null}
          <Text style={styles.heroOdo}>
            {formatOdometer(vehicle.currentOdometer)}
          </Text>
          {stats.lastServiceDate && (
            <Text style={styles.heroSub}>
              {t("vehicles.lastService")}: {stats.lastServiceDate}
            </Text>
          )}
        </View>

        <VehicleNavGrid
          totalServices={stats.totalServices}
          totalFuelLiters={stats.totalFuelLiters}
          totalOtherCost={stats.totalOtherCost}
          onNavigate={(screen) => navigation.navigate(screen, { vehicleId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  body: { flex: 1, paddingHorizontal: spacing.md },
  hero: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  heroImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
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
    ...typography.h2,
    color: colors.text0,
  },
  heroYear: { ...typography.bodyMedium, color: colors.text2 },
  heroOdo: {
    ...typography.h1,
    color: colors.accent,
  },
  heroSub: { ...typography.bodySmall, color: colors.text2 },
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
  navLabel: { ...typography.bodyStrong, color: colors.text0 },
  navSub: { ...typography.labelSmall, color: colors.text2, marginTop: 2 },
});
