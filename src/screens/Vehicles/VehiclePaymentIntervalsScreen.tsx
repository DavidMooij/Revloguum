import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { RootStackParamList } from "../../app/navigation/routes";
import { getDatabase } from "../../data/db/database";
import { SQLiteVehicleCostRepo } from "../../data/repositories/SQLiteVehicleCostRepo";
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import type { Vehicle } from "../../domain/entities/Vehicle";
import { usePaymentTypes } from "../../hooks/usePaymentTypes";
import { syncNotifications } from "../../notifications/syncNotifications";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography, typeScale } from "../../theme/typography";
import { formatVehicleName } from "../../utils/format";
import { generateUUID } from "../../utils/uuid";
import AlertModal from "../components/AlertModal";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useFeedback } from "../components/feedback/Feedbackprovider";
import PaymentIntervalConfig, {
  type PaymentIntervalDraft,
} from "./components/stats/PaymentIntervalConfig";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "VehiclePaymentIntervals"
>;

function cloneIntervals(
  intervals: PaymentIntervalDraft[],
): PaymentIntervalDraft[] {
  return intervals.map((interval) => ({ ...interval }));
}

function intervalsAreValid(intervals: PaymentIntervalDraft[]): boolean {
  return intervals.every(
    (interval) =>
      Number.isFinite(interval.amount) &&
      interval.amount > 0 &&
      (interval.intervalType !== "custom" || interval.intervalDays > 0),
  );
}

export default function VehiclePaymentIntervalsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { paymentTypes } = usePaymentTypes();
  const { showToast } = useFeedback();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [intervals, setIntervals] = useState<PaymentIntervalDraft[]>([]);
  const [initialIntervals, setInitialIntervals] = useState<
    PaymentIntervalDraft[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const db = await getDatabase();
      const [loadedVehicle, loadedPayments] = await Promise.all([
        new SQLiteVehicleRepo(db).getById(vehicleId),
        new SQLiteVehicleCostRepo(db).getIntervals(vehicleId),
      ]);
      if (!active) return;
      const loadedIntervals: PaymentIntervalDraft[] = loadedPayments.map(
        (interval) => ({
          id: interval.id,
          category: interval.category,
          amount: interval.amount,
          intervalType: interval.intervalType ?? "monthly",
          intervalDays: interval.intervalDays ?? 30,
          startDateTs: interval.dateTs,
          notes: interval.notes,
        }),
      );
      setVehicle(loadedVehicle);
      setIntervals(loadedIntervals);
      setInitialIntervals(cloneIntervals(loadedIntervals));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [vehicleId]);

  const dirty = JSON.stringify(intervals) !== JSON.stringify(initialIntervals);
  const valid = intervalsAreValid(intervals);
  const showSave = dirty && valid;
  const canSave = showSave && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const db = await getDatabase();
      await new SQLiteVehicleCostRepo(db).replaceIntervals(
        vehicleId,
        intervals.map((interval) => ({
          id: interval.id,
          category: interval.category,
          amount: interval.amount,
          intervalType: interval.intervalType,
          intervalDays: interval.intervalDays,
          startDateTs: interval.startDateTs,
          notes: interval.notes,
        })),
      );
      await syncNotifications();
      setInitialIntervals(cloneIntervals(intervals));
      showToast({ titleKey: "toast.vehicleUpdated", variant: "success" });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const vehicleName = vehicle
    ? formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)
    : "";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("vehicles.paymentIntervals")}
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
            { paddingBottom: insets.bottom + (showSave ? 104 : spacing.xl) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>
              {t("vehicles.paymentIntervalsEyebrow")}
            </Text>
            <Text style={styles.description}>
              {t("vehicles.paymentIntervalsDescription")}
            </Text>
          </View>
          <PaymentIntervalConfig
            paymentTypes={paymentTypes}
            intervals={intervals}
            onChange={setIntervals}
            onAdd={() =>
              setIntervals((current) => [
                {
                  id: generateUUID(),
                  category: paymentTypes[0]?.id ?? "insurance",
                  amount: 0,
                  intervalType: "yearly",
                  intervalDays: 365,
                  startDateTs: Date.now(),
                  notes: null,
                },
                ...current,
              ])
            }
          />
          {dirty && !valid ? (
            <Text style={styles.validation}>
              {t("vehicles.paymentIntervalsInvalid")}
            </Text>
          ) : null}
        </ScrollView>
      )}
      {showSave ? (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <PrimaryButton
            label={t("vehicles.savePaymentIntervals")}
            onPress={save}
            loading={saving}
          />
        </View>
      ) : null}
      <AlertModal
        visible={!!error}
        onClose={() => setError(null)}
        icon="exclamation-triangle"
        iconColor={colors.dangerText}
        title={t("common.error")}
        message={error ?? ""}
        actions={[
          {
            label: t("common.ok"),
            variant: "secondary",
            onPress: () => {},
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  heading: { gap: spacing.xs },
  eyebrow: { ...typography.overline, color: colors.warningText },
  description: {
    fontSize: typeScale.bodySmall,
    lineHeight: 19,
    color: colors.text1,
  },
  validation: {
    fontSize: typeScale.captionLarge,
    color: colors.warningText,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border1,
  },
});