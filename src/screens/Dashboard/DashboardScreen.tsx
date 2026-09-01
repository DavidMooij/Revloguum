import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import type { FuelEntry } from "../../domain/entities/FuelEntry";
import { SQLiteFuelRepo as FuelRepo } from "../../data/repositories/SQLiteFuelRepo";
import { haptic } from "@/utils/haptics";
import QuickFuelModal from "../Fuel/QuickFuelModal";
import VehicleSelector from "./components/VehicleSelector";
import DashboardInfoCard from "./components/DashboardInfoCard";
import { formatCost } from "@/utils/format";
import LastFuelCard from "./components/LastFuelCard";
import { getVehicleFunFact } from "@/utils/vehicleFunFact";
import { useServiceTypeLabel } from "@/hooks/useServiceTypeLabel";
import { usePaymentTypes } from "@/hooks/usePaymentTypes";
import { usePaymentTypeLabel } from "@/hooks/usePaymentTypeLabel";
import { useFeedback } from "../components/feedback/Feedbackprovider";
import { useAppStore } from "@/store/appStore";
import { syncNotifications } from "@/notifications/syncNotifications";
import { recalculateVehicleOdometer } from "@/utils/updateVehicleOdometer";
import {
  computeServiceDueStatus,
  isServiceOverdue,
} from "@/domain/services/serviceDue";
import {
  computePaymentDueSummary,
  type PaymentDueOccurrence,
} from "@/domain/services/paymentDue";

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
  overduePayments: PaymentDueOccurrence[];
  nextService: NextServiceItem | null;
  nextPayment: PaymentDueOccurrence | null;
}

function computeNextServiceScore(status: {
  nextDays: number | null;
  nextKm: number | null;
  interval: { intervalDays?: number; intervalKm?: number };
}): number {
  const scores: number[] = [];

  if (status.nextDays !== null && status.interval.intervalDays) {
    scores.push(status.nextDays / status.interval.intervalDays);
  }

  if (status.nextKm !== null && status.interval.intervalKm) {
    scores.push(status.nextKm / status.interval.intervalKm);
  }

  return scores.length ? Math.min(...scores) : Number.POSITIVE_INFINITY;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const getLabel = useServiceTypeLabel();
  const getPaymentTypeLabel = usePaymentTypeLabel();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { showToast } = useFeedback();
  const { paymentTypes } = usePaymentTypes();
  const { vehicles, activeVehicleId, setActiveVehicleId, refresh } =
    useVehicles();
  const activeVehicle =
    vehicles.find((m) => m.id === activeVehicleId) ?? vehicles[0] ?? null;
  const [data, setData] = useState<DashboardData>({
    lastFuel: null,
    overdueItems: [],
    overduePayments: [],
    nextService: null,
    nextPayment: null,
  });
  const [fuelModalVisible, setFuelModalVisible] = useState(false);
  const loadSeqRef = useRef(0);
  const paymentTypeById = new Map(paymentTypes.map((pt) => [pt.id, pt]));

  const loadData = useCallback(async (vehicleId: string | null) => {
    const seq = ++loadSeqRef.current;

    if (!vehicleId) {
      setData({
        lastFuel: null,
        overdueItems: [],
        overduePayments: [],
        nextService: null,
        nextPayment: null,
      });
      return;
    }

    const db = await getDatabase();
    const vehicleRepo = new SQLiteVehicleRepo(db);
    const serviceRepo = new SQLiteServiceEntryRepo(db);
    const fuelRepo = new FuelRepo(db);
    const costRepo = new SQLiteVehicleCostRepo(db);

    const vehicle = await vehicleRepo.getById(vehicleId);
    if (!vehicle) {
      if (seq === loadSeqRef.current) {
        setData({
          lastFuel: null,
          overdueItems: [],
          overduePayments: [],
          nextService: null,
          nextPayment: null,
        });
      }
      return;
    }

    const [lastFuelArr, paymentHistory, paymentIntervals] = await Promise.all([
      fuelRepo.fetchFiltered({ vehicleId, limit: 1 }),
      costRepo.getHistory(vehicleId),
      costRepo.getIntervals(vehicleId),
    ]);

    const lastFuel = lastFuelArr[0] ?? null;

    const paymentDue = computePaymentDueSummary({
      intervals: paymentIntervals,
      historyEntries: paymentHistory,
      nowTs: Date.now(),
      horizonEndTs: Date.now() + 3650 * 86400000,
    });

    const nextPayment = paymentDue.upcoming[0] ?? null;
    const overduePayments = paymentDue.overdue;

    let nextService: NextServiceItem | null = null;
    const overdueItems: OverdueItem[] = [];

    if (vehicle.serviceIntervals?.length) {
      const serviceTypeRepo = new SQLiteServiceTypeRepo(db);
      const allTypes = await serviceTypeRepo.getAll();
      const typeMap = new Map(allTypes.map((st) => [st.id, st]));
      const nowTs = Date.now();

      const candidates: {
        item: NextServiceItem;
        score: number;
      }[] = [];

      for (const interval of vehicle.serviceIntervals) {
        const st = typeMap.get(interval.serviceTypeId);
        if (!st) continue;

        const last = await serviceRepo.getLastByTypeForVehicle(
          vehicleId,
          interval.serviceTypeId,
        );

        const status = computeServiceDueStatus({
          interval,
          vehicle,
          lastEntry: last,
          nowTs,
        });

        if (status.kmOverdue !== null || status.daysOverdue !== null) {
          overdueItems.push({
            serviceTypeId: interval.serviceTypeId,
            serviceTypeName: st.name,
            serviceTypeIcon: st.icon,
            translationKey: st.translationKey,
            kmOverdue: status.kmOverdue,
            daysOverdue: status.daysOverdue,
            neverDone: status.neverDone,
          });
        }

        const isDueByDays = status.nextDays !== null;
        const isDueByKm = status.nextKm !== null;

        if ((isDueByDays || isDueByKm) && !isServiceOverdue(status)) {
          const score = computeNextServiceScore(status);

          candidates.push({
            item: {
              serviceTypeId: interval.serviceTypeId,
              serviceTypeName: st.name,
              serviceTypeIcon: st.icon,
              translationKey: st.translationKey,
              nextKm: status.nextKm,
              nextDays: status.nextDays,
            },
            score,
          });
        }
      }

      candidates.sort((a, b) => a.score - b.score);
      nextService = candidates[0]?.item ?? null;
    }

    const currentVehicleId =
      useAppStore.getState().activeVehicleId ??
      useAppStore.getState().vehicles[0]?.id ??
      null;

    if (seq !== loadSeqRef.current || currentVehicleId !== vehicleId) {
      return;
    }

    setData({
      lastFuel,
      overdueItems,
      overduePayments,
      nextService,
      nextPayment,
    });
  }, []);

  useEffect(() => {
    void loadData(activeVehicle?.id ?? null);
  }, [activeVehicle?.id, loadData]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const reload = async () => {
        await refresh();
        if (!cancelled) {
          const currentId =
            useAppStore.getState().activeVehicleId ??
            useAppStore.getState().vehicles[0]?.id ??
            null;
          await loadData(currentId);
        }
      };

      void reload();
      return () => {
        cancelled = true;
        loadSeqRef.current += 1;
      };
    }, [refresh, loadData]),
  );

  const handleQuickFuelSave = useCallback(
    async (entry: {
      odometerKm: number;
      liters: number;
      cost: number;
      notes: string | null;
    }) => {
      if (!activeVehicle) return;

      const vehicleId = activeVehicle.id;
      const db = await getDatabase();
      const fuelRepo = new FuelRepo(db);

      await fuelRepo.insert({
        vehicleId,
        dateTs: Date.now(),
        ...entry,
      });

      await recalculateVehicleOdometer(db, vehicleId);

      void (async () => {
        await refresh();
        const currentId =
          useAppStore.getState().activeVehicleId ??
          useAppStore.getState().vehicles[0]?.id ??
          null;
        await loadData(currentId);
      })();

      void syncNotifications().catch(() => {});
    },
    [activeVehicle, refresh, loadData],
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

  const overdueService = data.overdueItems[0] ?? null;

  const formatOverdueServiceSubtitle = (item: OverdueItem | null) => {
    if (!item) return t("dashboard.vehicleUpToDate");
    if (item.neverDone) return t("dashboard.neverDone");

    const chunks: string[] = [];
    if (item.kmOverdue != null && item.kmOverdue > 0) {
      chunks.push(
        `+${item.kmOverdue.toLocaleString()} km ${t("dashboard.overdue")}`,
      );
    }
    if (item.daysOverdue != null && item.daysOverdue > 0) {
      chunks.push(`+${item.daysOverdue} ${t("dashboard.daysOverdue")}`);
    }
    return chunks.join(" · ");
  };

  const getPaymentCategoryLabel = (category: string) => {
    const type = paymentTypeById.get(category);
    if (type) return getPaymentTypeLabel(type);

    const key = `costs.categories.${category}`;
    const translated = t(key);
    return translated === key ? category : translated;
  };

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

      <View
        style={[styles.body, vehicles.length > 1 && styles.bodyWithSelector]}
      >
        <LastFuelCard
          entry={data.lastFuel}
          t={t}
          onPress={() =>
            navigation.navigate("VehicleFuelHistory", {
              vehicleId: activeVehicle.id,
            })
          }
        />

        <View style={styles.infoGrid}>
          <DashboardInfoCard
            label={t("dashboard.overdueServices")}
            title={
              overdueService
                ? getLabel({
                    name: overdueService.serviceTypeName,
                    translationKey: overdueService.translationKey,
                  })
                : t("dashboard.noOverdueServices")
            }
            subtitle={formatOverdueServiceSubtitle(overdueService)}
            icon={overdueService ? "exclamation-triangle" : "check-circle"}
            onPress={() =>
              navigation.navigate("VehicleHistory", {
                vehicleId: activeVehicle.id,
              })
            }
            variant={overdueService ? "warning" : "normal"}
          />

          <DashboardInfoCard
            label={t("dashboard.overduePayments")}
            title={
              data.overduePayments[0]
                ? getPaymentCategoryLabel(data.overduePayments[0].category)
                : t("dashboard.noOverduePayments")
            }
            subtitle={
              data.overduePayments[0]
                ? t("dashboard.daysOverdueDetailed", {
                    days: data.overduePayments[0].daysOverdue ?? 0,
                  })
                : t("dashboard.paymentStatusGood")
            }
            icon={
              data.overduePayments[0] ? "exclamation-triangle" : "check-circle"
            }
            value={
              data.overduePayments[0]
                ? formatCost(data.overduePayments[0].amount)
                : undefined
            }
            onPress={() =>
              navigation.navigate("VehicleCosts", {
                vehicleId: activeVehicle.id,
              })
            }
            variant={data.overduePayments[0] ? "warning" : "normal"}
          />
        </View>

        <View style={styles.infoGrid}>
          <DashboardInfoCard
            label={t("dashboard.nextService")}
            title={
              data.nextService
                ? getLabel({
                    name: data.nextService.serviceTypeName,
                    translationKey: data.nextService.translationKey,
                  })
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
                ? getPaymentCategoryLabel(data.nextPayment.category)
                : t("dashboard.noPayments")
            }
            subtitle={
              data.nextPayment
                ? t("dashboard.inDays", {
                    days: data.nextPayment.daysUntilDue ?? 0,
                  })
                : t("dashboard.addPaymentsHint")
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
        onSave={async (data) => {
          await handleQuickFuelSave(data);
          showToast({ titleKey: "toast.fuelAdded", variant: "success" });
        }}
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
    padding: spacing.md,
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
    marginTop: 0,
    fontSize: typeScale.titleXL,
    fontWeight: "800",
    color: colors.text0,
    letterSpacing: -0.8,
  },
  odoJoke: {
    marginTop: spacing.xs,
    fontSize: typeScale.bodySmall,
    color: colors.text2,
    fontStyle: "italic",
    lineHeight: 12,
  },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  bodyWithSelector: {
    paddingTop: spacing.sm,
  },

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
    gap: spacing.sm,
  },
  infoHalf: {
    flex: 1,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: typeScale.body,
  },
  fab: {
    position: "absolute",
    bottom: 55,
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
