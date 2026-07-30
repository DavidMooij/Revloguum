import React, { useState, useCallback } from "react";
import { SQLiteVehicleCostRepo } from "../../data/repositories/SQLiteVehicleCostRepo";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { typography, typeScale } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import { useVehicles } from "../../hooks/useVehicles";
import { getDatabase } from "../../data/db/database";
import { SQLiteServiceEntryRepo } from "../../data/repositories/SQLiteServiceEntryRepo";
import { SQLiteServiceTypeRepo } from "../../data/repositories/SQLiteServiceTypeRepo";
import type { FuelEntry } from "../../domain/entities/FuelEntry";
import { SQLiteFuelRepo as FuelRepo } from "../../data/repositories/SQLiteFuelRepo";
import { haptic } from "@/utils/haptics";
import QuickFuelModal from "../Fuel/QuickFuelModal";
import VehicleSelector from "./components/VehicleSelector";
import { VehicleCost } from "@/domain/entities/VehicleCost";
import OverdueServicesCard from "./components/OverdueServiceCard";
import DashboardInfoCard from "./components/DashboardInfoCard";
import { formatCost } from "@/utils/format";
import { useFuel } from "@/hooks/useFuel";
import LastFuelCard from "./components/LastFuelCard";
import { getVehicleFunFact } from "@/utils/vehicleFunFact";
import { useServiceTypeLabel } from "@/hooks/useServiceTypeLabel";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export interface OverdueItem {
  serviceTypeId: string;
  serviceTypeName: string;
  serviceTypeIcon: string;
  translationKey?: string;
  kmOverdue: number | null;
  daysOverdue: number | null;
  neverDone: boolean;
}

export interface NextServiceItem {
  serviceTypeId: string;
  serviceTypeName: string;
  serviceTypeIcon: string;
  translationKey?: string;
  nextKm: number | null;
  nextDays: number | null;
}

interface DashboardData {
  lastFuel: FuelEntry | null;
  overdueItems: OverdueItem[];
  nextService: NextServiceItem | null;
  nextPayment: VehicleCost | null;
}

function getNextPayment(costs: VehicleCost[]): VehicleCost | null {
  const recurring = costs.filter((c) => c.intervalType != null);
  if (!recurring.length) return null;

  const now = Date.now();
  const withDue = recurring.map((c) => {
    let nextTs = c.dateTs;
    if (c.intervalType === "monthly") {
      while (nextTs < now) nextTs += 30 * 86400000;
    } else {
      const d = new Date(c.dateTs);
      while (nextTs < now) {
        d.setFullYear(d.getFullYear() + 1);
        nextTs = d.getTime();
      }
    }
    return { c, nextTs };
  });

  withDue.sort((a, b) => a.nextTs - b.nextTs);
  return withDue[0]?.c ?? null;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { vehicles, activeVehicleId, setActiveVehicleId, refresh } =
    useVehicles();
  const activeVehicle =
    vehicles.find((m) => m.id === activeVehicleId) ?? vehicles[0] ?? null;
  const [data, setData] = useState<DashboardData>({
    lastFuel: null,
    overdueItems: [],
    nextService: null,
    nextPayment: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [fuelModalVisible, setFuelModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeVehicle) return;
    const db = await getDatabase();
    const serviceRepo = new SQLiteServiceEntryRepo(db);
    const fuelRepo = new FuelRepo(db);
    const costRepo = new SQLiteVehicleCostRepo(db);

    const [lastFuelArr, allCosts] = await Promise.all([
      fuelRepo.fetchFiltered({ vehicleId: activeVehicle.id, limit: 1 }),
      costRepo.getAll(activeVehicle.id),
    ]);

    const lastFuel = lastFuelArr[0] ?? null;
    const nextPayment = getNextPayment(allCosts);
    let nextService: NextServiceItem | null = null;

    if (activeVehicle.serviceIntervals?.length) {
      const serviceTypeRepo = new SQLiteServiceTypeRepo(db);
      const allTypes = await serviceTypeRepo.getAll();
      const typeMap = new Map(allTypes.map((st) => [st.id, st]));

      const candidates: {
        item: NextServiceItem;
        score: number;
      }[] = [];

      for (const interval of activeVehicle.serviceIntervals) {
        const st = typeMap.get(interval.serviceTypeId);
        if (!st) continue;

        const last = await serviceRepo.getLastByTypeForVehicle(
          activeVehicle.id,
          interval.serviceTypeId,
        );

        let nextKm: number | null = null;
        let nextDays: number | null = null;
        let score = Infinity;

        if (last) {
          if (interval.intervalKm) {
            const kmSince = activeVehicle.currentOdometer - last.odometerKm;

            nextKm = Math.max(interval.intervalKm - kmSince, 0);

            score = Math.min(score, nextKm);
          }

          if (interval.intervalDays) {
            const daysSince = (Date.now() - last.dateTs) / 86400000;

            nextDays = Math.max(
              Math.ceil(interval.intervalDays - daysSince),
              0,
            );

            score = Math.min(score, nextDays * 100);
          }
        }

        if (nextKm !== null || nextDays !== null) {
          candidates.push({
            item: {
              serviceTypeId: interval.serviceTypeId,
              serviceTypeName: st.name,
              serviceTypeIcon: st.icon,
              translationKey: st.translationKey,
              nextKm,
              nextDays,
            },
            score,
          });
        }
      }

      candidates.sort((a, b) => a.score - b.score);

      nextService = candidates[0]?.item ?? null;
    }

    const overdueItems: OverdueItem[] = [];

    if (activeVehicle.serviceIntervals?.length) {
      const serviceTypeRepo = new SQLiteServiceTypeRepo(db);
      const allTypes = await serviceTypeRepo.getAll();
      const typeMap = new Map(allTypes.map((st) => [st.id, st]));

      for (const interval of activeVehicle.serviceIntervals) {
        const st = typeMap.get(interval.serviceTypeId);
        if (!st) continue;

        const last = await serviceRepo.getLastByTypeForVehicle(
          activeVehicle.id,
          interval.serviceTypeId,
        );

        let kmOverdue: number | null = null;
        let daysOverdue: number | null = null;

        if (last) {
          if (interval.intervalKm) {
            const kmSince = activeVehicle.currentOdometer - last.odometerKm;

            if (kmSince >= interval.intervalKm) {
              kmOverdue = kmSince - interval.intervalKm;
            }
          }

          if (interval.intervalDays) {
            const daysSince = (Date.now() - last.dateTs) / 86400000;

            if (daysSince >= interval.intervalDays) {
              daysOverdue = Math.floor(daysSince - interval.intervalDays);
            }
          }
        } else {
          if (
            interval.intervalKm &&
            activeVehicle.currentOdometer >= interval.intervalKm
          ) {
            kmOverdue = activeVehicle.currentOdometer - interval.intervalKm;
          }

          if (interval.intervalDays) {
            const daysSinceCreation =
              (Date.now() - activeVehicle.createdAt) / 86400000;

            if (daysSinceCreation >= interval.intervalDays) {
              daysOverdue = Math.floor(
                daysSinceCreation - interval.intervalDays,
              );
            }
          }
        }

        if (kmOverdue !== null || daysOverdue !== null) {
          overdueItems.push({
            serviceTypeId: interval.serviceTypeId,
            serviceTypeName: st.name,
            serviceTypeIcon: st.icon,
            translationKey: st.translationKey,
            kmOverdue,
            daysOverdue,
            neverDone: !last,
          });
        }
      }
    }

    setData({
      lastFuel,
      overdueItems,
      nextService,
      nextPayment,
    });
  }, [activeVehicle?.id, activeVehicle?.currentOdometer]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const { addEntry } = useFuel({
    vehicleId: activeVehicle?.id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleQuickFuelSave = useCallback(
    async (entry: {
      odometerKm: number;
      liters: number;
      cost: number;
      notes: string | null;
    }) => {
      if (!activeVehicle) return;

      await addEntry({
        vehicleId: activeVehicle.id,
        dateTs: Date.now(),
        ...entry,
      });

      await refresh();
      await loadData();
    },
    [activeVehicle, addEntry, refresh, loadData],
  );

  if (!activeVehicle) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={typography.h2}>{t("dashboard.title")}</Text>
        </View>
        <View style={styles.emptyCenter}>
          <Icon name="car-side" size={48} color={colors.text3} />
          <Text
            style={[
              typography.h3,
              {
                color: colors.text2,
                marginTop: spacing.lg,
                textAlign: "center",
              },
            ]}
          >
            {t("dashboard.noVehicles")}
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddVehicle", {})}
          >
            <Text style={styles.addBtnText}>{t("dashboard.addVehicle")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function formatNextService(service: NextServiceItem | null) {
    if (!service) return "-";

    if (service.nextKm !== null) {
      return t("dashboard.inKm", {
        km: service.nextKm.toLocaleString(),
      });
    }

    if (service.nextDays !== null) {
      return t("dashboard.inDays", {
        days: service.nextDays,
      });
    }

    return "-";
  }

  function getDaysUntilNext(cost: VehicleCost): number {
    const now = Date.now();

    if (cost.intervalType === "monthly") {
      const next = cost.dateTs + 30 * 86400000;
      return Math.ceil((next - now) / 86400000);
    }

    if (cost.intervalType === "yearly") {
      const date = new Date(cost.dateTs);
      const next = new Date(date);

      next.setFullYear(next.getFullYear() + 1);

      while (next.getTime() < now) {
        next.setFullYear(next.getFullYear() + 1);
      }

      return Math.ceil((next.getTime() - now) / 86400000);
    }

    return 0;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={typography.h2}>{t("dashboard.title")}</Text>
        <Text style={typography.bodySmall}>{t("dashboard.subtitle")}</Text>
      </View>

      <View>
        {vehicles.length > 1 && (
          <VehicleSelector
            vehicles={vehicles}
            activeId={activeVehicleId}
            onSelect={(id) => {
              haptic.light();
              setActiveVehicleId(id);
            }}
          />
        )}
      </View>

      <View style={styles.body}>
        <LastFuelCard
          entry={data.lastFuel}
          t={t}
          onPress={() =>
            navigation.navigate("VehicleFuelHistory", {
              vehicleId: activeVehicle.id,
            })
          }
        />

        <OverdueServicesCard
          item={data.overdueItems[0] ?? null}
          onPress={() =>
            navigation.navigate("VehicleHistory", {
              vehicleId: activeVehicle.id,
            })
          }
          t={t}
        />
        <View style={styles.infoGrid}>
          <DashboardInfoCard
            label={t("dashboard.nextService")}
            title={
              data.nextService
                ? getLabel({ name: data.nextService.serviceTypeName, translationKey: data.nextService.translationKey })
                : t("dashboard.noServiceDue")
            }
            subtitle={
              data.nextService
                ? formatNextService(data.nextService)
                : t("dashboard.allGood")
            }
            icon={data.nextService?.serviceTypeIcon ?? "tools"}
            onPress={() =>
              navigation.navigate("VehicleHistory", {
                vehicleId: activeVehicle.id,
              })
            }
          />
          <DashboardInfoCard
            label={t("dashboard.nextPayment")}
            title={
              data.nextPayment
                ? t(`costs.categories.${data.nextPayment.category}`)
                : t("dashboard.noPayments")
            }
            subtitle={
              data.nextPayment
                ? t("dashboard.inDays", {
                    days: getDaysUntilNext(data.nextPayment),
                  })
                : t("dashboard.addCostsHint")
            }
            icon="receipt"
            value={
              data.nextPayment ? formatCost(data.nextPayment.amount) : undefined
            }
            onPress={() =>
              navigation.navigate("VehicleCosts", {
                vehicleId: activeVehicle.id,
              })
            }
          />
        </View>

        <View style={styles.odoCard}>
          <View style={styles.odoIcon}>
            <Icon name="tachometer-alt" size={18} color={colors.accent} />
          </View>

          <View style={styles.odoContent}>
            <Text style={styles.odoLabel}>{t("dashboard.odometer")}</Text>

            <Text style={styles.odoValue}>
              {activeVehicle.currentOdometer.toLocaleString()} km
            </Text>

            <Text style={styles.odoJoke}>
              {getVehicleFunFact(
                t,
                activeVehicle.vehicleType,
                activeVehicle.currentOdometer,
              )}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          haptic.light();
          setFuelModalVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Icon name="gas-pump" size={18} color={colors.white} />
      </TouchableOpacity>

      <QuickFuelModal
        visible={fuelModalVisible}
        onClose={() => setFuelModalVisible(false)}
        onSave={handleQuickFuelSave}
        vehicle={activeVehicle}
        lastEntry={data.lastFuel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },

  header: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  odoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  odoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  odoContent: {
    flex: 1,
  },

  odoLabel: {
    ...typography.overline,
  },

  odoValue: {
    marginTop: 3,
    fontSize: typeScale.numericLarge,
    fontWeight: "800",
    color: colors.text0,
    letterSpacing: -0.8,
  },
  odoJoke: {
    marginTop: spacing.xs,
    fontSize: typeScale.bodySmall,
    color: colors.text2,
    fontStyle: "italic",
    lineHeight: 18,
  },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },

  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xxl,
  },
  addBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  infoGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  infoHalf: {
    flex: 1,
  },
  addBtnText: { color: colors.white, fontWeight: "600", fontSize: typeScale.body },
  fab: {
    position: "absolute",
    bottom: 90,
    right: spacing.lg,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
