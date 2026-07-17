import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
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
import { formatDate } from "../../utils/date";
import VehicleCard from "./components/VehicleCard";
import EmptyState from "../components/EmptyState";
import { FontAwesome5 as Icon } from "@expo/vector-icons";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VehicleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { vehicles, refresh } = useVehicles();
  const [stats, setStats] = useState<
    Record<string, { count: number; lastDate: string | null }>
  >({});
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (vehicles.length === 0) return;
    const db = await getDatabase();
    const repo = new SQLiteServiceEntryRepo(db);
    const results: typeof stats = {};
    await Promise.all(
      vehicles.map(async (m) => {
        const [count, last] = await Promise.all([
          repo.getCountForVehicle(m.id),
          repo.getLastForVehicle(m.id),
        ]);
        results[m.id] = {
          count,
          lastDate: last ? formatDate(last.dateTs) : null,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    await loadStats();
    setRefreshing(false);
  }, [refresh, loadStats]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={typography.h2}>{t('vehicles.garageTitle')}</Text>
          <Text style={typography.bodySmall}>
            {t('vehicles.garageSubtitle', { count: vehicles.length })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddVehicle", {})}
          hitSlop={8}
        >
          <Icon name="plus" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {vehicles.length === 0 ? (
          <EmptyState
            icon="motorcycle"
            title={t("vehicles.noVehicle")}
            subtitle={t("vehicles.addFirstVehicle")}
          />
        ) : (
          vehicles.map((moto) => (
            <VehicleCard
              key={moto.id}
              vehicle={moto}
              onPress={() =>
                navigation.navigate("VehicleDetail", {
                  vehicleId: moto.id,
                })
              }
              onEdit={() =>
                navigation.navigate("AddVehicle", { editId: moto.id })
              }
              serviceCount={stats[moto.id]?.count ?? 0}
              lastServiceDate={stats[moto.id]?.lastDate ?? null}
            />
          ))
        )}
      </ScrollView>
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
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
});
