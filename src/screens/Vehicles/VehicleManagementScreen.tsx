import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { getDatabase } from "../../data/db/database";
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import { SQLiteVehicleCostRepo } from "../../data/repositories/SQLiteVehicleCostRepo";
import type { ServiceInterval, Vehicle } from "../../domain/entities/Vehicle";
import { usePaymentTypes } from "../../hooks/usePaymentTypes";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { syncNotifications } from "../../notifications/syncNotifications";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { formatVehicleName } from "../../utils/format";
import { generateUUID } from "../../utils/uuid";
import DocumentSection from "../components/documents/DocumentSection";
import AlertModal from "../components/AlertModal";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useFeedback } from "../components/feedback/Feedbackprovider";
import PaymentIntervalConfig, {
  type PaymentIntervalDraft,
} from "./components/stats/PaymentIntervalConfig";
import ServiceIntervalConfig from "./components/stats/ServiceIntervalConfig";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleManagement">;

export default function VehicleManagementScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<Props["route"]>();
  const { vehicleId } = route.params;
  const { serviceTypes } = useServiceTypes();
  const { paymentTypes } = usePaymentTypes();
  const { showToast } = useFeedback();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [serviceIntervals, setServiceIntervals] = useState<ServiceInterval[]>([]);
  const [paymentIntervals, setPaymentIntervals] = useState<PaymentIntervalDraft[]>([]);
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
        if (!active || !loadedVehicle) return;
        setVehicle(loadedVehicle);
        setServiceIntervals(loadedVehicle.serviceIntervals ?? []);
        setPaymentIntervals(
          loadedPayments.map((interval) => ({
            id: interval.id,
            category: interval.category,
            amount: interval.amount,
            intervalType: interval.intervalType ?? "monthly",
            intervalDays: interval.intervalDays ?? 30,
            startDateTs: interval.dateTs,
            notes: interval.notes,
          })),
        );
    })();
    return () => {
      active = false;
    };
  }, [vehicleId]);

  const saveIntervals = async () => {
    if (!vehicle) return;
    setSaving(true);
    try {
      const db = await getDatabase();
      await new SQLiteVehicleRepo(db).update(vehicleId, { serviceIntervals });
      await new SQLiteVehicleCostRepo(db).replaceIntervals(
        vehicleId,
        paymentIntervals
          .filter((interval) => interval.amount > 0)
          .map((interval) => ({
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
      showToast({ titleKey: "toast.vehicleUpdated", variant: "success" });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!vehicle) return null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("vehicles.managementTitle")}
        subtitle={formatVehicleName(vehicle.make, vehicle.model, vehicle.nickname)}
        showBack
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionHeader}>
          <Icon name="bell" size={13} color={colors.accent} />
          <Text style={styles.sectionTitle}>{t("vehicles.serviceIntervals")}</Text>
        </View>
        <ServiceIntervalConfig
          serviceTypes={serviceTypes}
          intervals={serviceIntervals}
          onChange={setServiceIntervals}
        />

        <View style={styles.sectionHeader}>
          <Icon name="receipt" size={13} color={colors.accent} />
          <Text style={styles.sectionTitle}>{t("vehicles.paymentIntervals")}</Text>
        </View>
        <PaymentIntervalConfig
          paymentTypes={paymentTypes}
          intervals={paymentIntervals}
          onChange={setPaymentIntervals}
          onAdd={() =>
            setPaymentIntervals((current) => [
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

        <PrimaryButton
          label={t("vehicles.saveIntervals")}
          onPress={saveIntervals}
          loading={saving}
        />

        <DocumentSection
          vehicleId={vehicleId}
          ownerType="vehicle"
          ownerId={vehicleId}
          title={t("documents.vehicleTitle")}
        />
      </ScrollView>
      <AlertModal
        visible={!!error}
        onClose={() => setError(null)}
        icon="exclamation-triangle"
        iconColor={colors.dangerText}
        title={t("common.error")}
        message={error ?? ""}
        actions={[
          { label: t("common.ok"), variant: "secondary", onPress: () => {} },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { ...typography.overline },
});