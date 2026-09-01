import React, { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { useVehicles } from "../../hooks/useVehicles";
import { getDatabase } from "../../data/db/database";
import { SQLiteServiceEntryRepo } from "../../data/repositories/SQLiteServiceEntryRepo";
import { SQLiteFuelRepo } from "../../data/repositories/SQLiteFuelRepo";
import { SQLiteVehicleCostRepo } from "../../data/repositories/SQLiteVehicleCostRepo";
import VehicleGarageCard from "./components/VehicleGarageCard";
import AddVehicleCard from "./components/AddVehicleCard";
import type { Vehicle } from "../../domain/entities/Vehicle";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ADD_CARD_ID = "__add_vehicle__";

interface VehicleStats {
  count: number;
  fuelLiters: number;
  otherCost: number;
}

export default function VehicleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { vehicles } = useVehicles();
  const [stats, setStats] = useState<Record<string, VehicleStats>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const pages = [...vehicles, { id: ADD_CARD_ID } as Vehicle];

  const loadStats = useCallback(async () => {
    if (vehicles.length === 0) return;
    const db = await getDatabase();
    const serviceRepo = new SQLiteServiceEntryRepo(db);
    const fuelRepo = new SQLiteFuelRepo(db);
    const costRepo = new SQLiteVehicleCostRepo(db);
    const results: Record<string, VehicleStats> = {};
    await Promise.all(
      vehicles.map(async (m) => {
        const [count, fuelStats, otherCost] = await Promise.all([
          serviceRepo.getCountForVehicle(m.id),
          fuelRepo.getStats({ vehicleId: m.id }),
          costRepo.getTotalCost(m.id),
        ]);
        results[m.id] = {
          count,
          fuelLiters: fuelStats.totalLiters,
          otherCost,
        };
      }),
    );
    setStats(results);
  }, [vehicles]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (index !== activeIndex) setActiveIndex(index);
    },
    [activeIndex],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={typography.h2}>{t("vehicles.garageTitle")}</Text>
          <Text style={typography.bodySmall}>
            {t("vehicles.garageSubtitle", { count: vehicles.length })}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) =>
          item.id === ADD_CARD_ID ? (
            <AddVehicleCard
              width={SCREEN_WIDTH}
              hasVehicles={vehicles.length > 0}
              onPress={() => navigation.navigate("AddVehicle", {})}
            />
          ) : (
            <VehicleGarageCard
              vehicle={item}
              width={SCREEN_WIDTH}
              serviceCount={stats[item.id]?.count ?? 0}
              totalFuelLiters={stats[item.id]?.fuelLiters ?? 0}
              totalOtherCost={stats[item.id]?.otherCost ?? 0}
              onEdit={() =>
                navigation.navigate("AddVehicle", { editId: item.id })
              }
              onManage={() =>
                navigation.navigate("VehicleManagement", { vehicleId: item.id })
              }
              onNavigate={(screen) =>
                navigation.navigate(screen, { vehicleId: item.id })
              }
            />
          )
        }
      />
      {pages.length > 1 && (
        <View
          style={[styles.dots, { paddingBottom: insets.bottom + spacing.md }]}
        >
          {pages.map((p, i) => (
            <View
              key={p.id}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.bg3,
  },
  dotActive: { width: 22, backgroundColor: colors.accent },
});
