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
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import type { ServiceInterval, Vehicle } from "../../domain/entities/Vehicle";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { syncNotifications } from "../../notifications/syncNotifications";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography, typeScale } from "../../theme/typography";
import { formatVehicleName } from "../../utils/format";
import AlertModal from "../components/AlertModal";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useFeedback } from "../components/feedback/Feedbackprovider";
import ServiceIntervalConfig from "./components/stats/ServiceIntervalConfig";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "VehicleServiceIntervals"
>;

function cloneIntervals(intervals: ServiceInterval[]): ServiceInterval[] {
  return intervals.map((interval) => ({ ...interval }));
}

function intervalsAreValid(intervals: ServiceInterval[]): boolean {
  return intervals.every(
    (interval) =>
      (Number.isFinite(interval.intervalKm) &&
        (interval.intervalKm ?? 0) > 0) ||
      (Number.isFinite(interval.intervalDays) &&
        (interval.intervalDays ?? 0) > 0),
  );
}

export default function VehicleServiceIntervalsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { serviceTypes } = useServiceTypes();
  const { showToast } = useFeedback();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [intervals, setIntervals] = useState<ServiceInterval[]>([]);
  const [initialIntervals, setInitialIntervals] = useState<ServiceInterval[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const db = await getDatabase();
      const loadedVehicle = await new SQLiteVehicleRepo(db).getById(vehicleId);
      if (!active) return;
      const loadedIntervals = cloneIntervals(
        loadedVehicle?.serviceIntervals ?? [],
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
      await new SQLiteVehicleRepo(db).update(vehicleId, {
        serviceIntervals: intervals,
      });
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
        title={t("vehicles.serviceIntervals")}
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
              {t("vehicles.serviceIntervalsEyebrow")}
            </Text>
            <Text style={styles.description}>
              {t("vehicles.serviceIntervalsDescription")}
            </Text>
          </View>
          <ServiceIntervalConfig
            serviceTypes={serviceTypes}
            intervals={intervals}
            onChange={setIntervals}
          />
          {dirty && !valid ? (
            <Text style={styles.validation}>
              {t("vehicles.serviceIntervalsInvalid")}
            </Text>
          ) : null}
        </ScrollView>
      )}
      {showSave ? (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <PrimaryButton
            label={t("vehicles.saveServiceIntervals")}
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
  eyebrow: { ...typography.overline, color: colors.accentText },
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