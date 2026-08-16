import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typeScale, typography } from "../../theme/typography";
import { useVehicles } from "../../hooks/useVehicles";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { usePaymentTypes } from "../../hooks/usePaymentTypes";
import { getDatabase } from "../../data/db/database";
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import { SQLiteVehicleCostRepo } from "../../data/repositories/SQLiteVehicleCostRepo";
import ScreenHeader from "../components/ScreenHeader";
import TextInputField from "../components/TextInputField";
import PrimaryButton from "../components/PrimaryButton";
import AlertModal from "../components/AlertModal";
import { haptic } from "@/utils/haptics";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import type { ServiceInterval } from "../../domain/entities/Vehicle";
import type { VehicleType } from "../../domain/entities/Vehicle";
import { vehicleTypeIcon } from "../../utils/vehicleType";
import ServiceIntervalConfig from "./components/stats/ServiceIntervalConfig";
import { decryptImage, encryptImage } from "@/security/imageEncryption";
import { useFeedback } from "../components/feedback/Feedbackprovider";
import PaymentIntervalConfig, {
  type PaymentIntervalDraft,
} from "./components/stats/PaymentIntervalConfig";
import { generateUUID } from "@/utils/uuid";
import { syncNotifications } from "@/notifications/syncNotifications";

type Props = NativeStackScreenProps<RootStackParamList, "AddVehicle">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AddVehicleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const editId = route.params?.editId;
  const isEditing = !!editId;

  const { vehicles, addVehicle, deleteVehicle, updateVehicle } = useVehicles();
  const { showToast, showCelebration } = useFeedback();

  const { serviceTypes } = useServiceTypes();
  const { paymentTypes } = usePaymentTypes();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [nickname, setNickname] = useState("");
  const [odometer, setOdometer] = useState("");
  const [defaultTankLiters, setDefaultTankLiters] = useState("");
  const [defaultFuelPrice, setDefaultFuelPrice] = useState("");
  const [serviceIntervals, setServiceIntervals] = useState<ServiceInterval[]>(
    [],
  );
  const [paymentIntervals, setPaymentIntervals] = useState<
    PaymentIntervalDraft[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    make?: string;
    model?: string;
    odometer?: string;
    tankLiters?: string;
  }>({});
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>("motorcycle");
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const vehicleTypeLabel =
    vehicleType === "motorcycle"
      ? t("vehicles.vehicleTypeMotorcycle")
      : vehicleType === "car"
        ? t("vehicles.vehicleTypeCar")
        : t("vehicles.vehicleTypeOther");

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const db = await getDatabase();
      const repo = new SQLiteVehicleRepo(db);
      const costRepo = new SQLiteVehicleCostRepo(db);
      const [moto, loadedIntervals] = await Promise.all([
        repo.getById(editId),
        costRepo.getIntervals(editId),
      ]);
      if (!moto) return;
      setMake(moto.make);
      setModel(moto.model);
      setYear(moto.year ? String(moto.year) : "");
      setNickname(moto.nickname ?? "");
      setOdometer(String(moto.currentOdometer));
      setDefaultTankLiters(
        moto.defaultTankLiters ? String(moto.defaultTankLiters) : "",
      );
      setDefaultFuelPrice(
        moto.defaultFuelPrice ? String(moto.defaultFuelPrice) : "",
      );
      setServiceIntervals(moto.serviceIntervals ?? []);
      setPhotoPath(moto.photoPath ?? null);
      setVehicleType(moto.vehicleType ?? "motorcycle");
      setPaymentIntervals(
        loadedIntervals.map((iv) => ({
          id: iv.id,
          category: iv.category,
          amount: iv.amount,
          intervalType: (iv.intervalType ?? "monthly") as
            | "monthly"
            | "yearly"
            | "custom",
          intervalDays:
            iv.intervalDays ??
            (iv.intervalType === "yearly"
              ? 365
              : iv.intervalType === "custom"
                ? 30
                : 30),
          startDateTs: iv.dateTs,
          notes: iv.notes ?? null,
        })),
      );
    })();
  }, [editId]);

  useEffect(() => {
    if (!photoPath) return;
    decryptImage(photoPath)
      .then(setDisplayUri)
      .catch(() => {});
  }, [photoPath]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) {
      setNewPhotoUri(result.assets[0].uri);
      setDisplayUri(result.assets[0].uri);
    }
  };

  const validate = useCallback(() => {
    const errs: typeof errors = {};
    if (!make.trim()) errs.make = t("vehicles.errorMakeRequired");
    if (!model.trim()) errs.model = t("vehicles.errorModelRequired");
    const odo = parseInt(odometer, 10);
    if (isNaN(odo) || odo < 0)
      errs.odometer = t("vehicles.errorOdometerInvalid");
    const tank = defaultTankLiters.trim() ? parseFloat(defaultTankLiters) : NaN;
    if (isNaN(tank) || tank <= 0)
      errs.tankLiters = t("vehicles.errorTankRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [make, model, odometer, defaultTankLiters, t]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      haptic.error();
      return;
    }
    haptic.light();
    setSaving(true);
    try {
      const parsedYear = year.trim() ? parseInt(year, 10) : null;
      const parsedOdo = parseInt(odometer, 10);
      const parsedTankLiters = defaultTankLiters.trim()
        ? parseFloat(defaultTankLiters)
        : null;
      const parsedFuelPrice = defaultFuelPrice.trim()
        ? parseFloat(defaultFuelPrice)
        : null;

      const payload = {
        make: make.trim(),
        model: model.trim(),
        year: parsedYear,
        nickname: nickname.trim() || null,
        currentOdometer: parsedOdo,
        photoPath: newPhotoUri
          ? await encryptImage(newPhotoUri)
          : (photoPath ?? null),
        defaultTankLiters: parsedTankLiters,
        defaultFuelPrice: parsedFuelPrice,
        serviceIntervals,
        vehicleType,
      };

      const mappedIntervals = paymentIntervals
        .filter((iv) => iv.amount > 0)
        .map((iv) => ({
          id: iv.id,
          category: iv.category,
          amount: iv.amount,
          intervalType: iv.intervalType,
          intervalDays:
            iv.intervalType === "custom"
              ? Math.max(1, Math.floor(iv.intervalDays || 1))
              : iv.intervalType === "yearly"
                ? 365
                : 30,
          startDateTs: iv.startDateTs,
          notes: iv.notes ?? null,
        }));

      const wasFirstVehicle = !isEditing && vehicles.length === 0;
      let targetVehicleId = editId ?? null;

      if (isEditing && editId) {
        await updateVehicle(editId, payload);
        targetVehicleId = editId;
        haptic.success();
        showToast({ titleKey: "toast.vehicleUpdated", variant: "success" });
      } else {
        const created = await addVehicle(payload);
        targetVehicleId = created.id;
        haptic.success();
        if (wasFirstVehicle) {
          showCelebration({
            titleKey: "celebration.firstVehicle.title",
            subtitleKey: "celebration.firstVehicle.subtitle",
            variant: "milestone",
          });
        } else {
          showToast({ titleKey: "toast.vehicleAdded", variant: "success" });
        }
      }

      if (targetVehicleId) {
        const db = await getDatabase();
        const costRepo = new SQLiteVehicleCostRepo(db);
        await costRepo.replaceIntervals(targetVehicleId, mappedIntervals);
        await syncNotifications();
      }

      navigation.goBack();
    } catch (e) {
      haptic.error();
      setErrorAlert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [
    validate,
    make,
    model,
    year,
    nickname,
    odometer,
    defaultTankLiters,
    defaultFuelPrice,
    serviceIntervals,
    paymentIntervals,
    vehicleType,
    isEditing,
    editId,
    vehicles,
    addVehicle,
    updateVehicle,
    navigation,
    newPhotoUri,
    photoPath,
    showToast,
    showCelebration,
  ]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader
          title={
            isEditing
              ? t("vehicles.editType", { type: vehicleTypeLabel })
              : t("vehicles.addType", { type: vehicleTypeLabel })
          }
          showBack
          rightElement={
            isEditing ? (
              <TouchableOpacity
                onPress={() => {
                  haptic.error();
                  setDeleteAlert(true);
                }}
                hitSlop={12}
                style={styles.deleteBtn}
              >
                <Icon name="trash-alt" size={16} color={colors.danger} />
              </TouchableOpacity>
            ) : null
          }
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8}>
            <View style={styles.photoCard}>
              {displayUri ? (
                <Image source={{ uri: displayUri }} style={styles.photo} />
              ) : (
                <View style={styles.placeholder}>
                  <Icon
                    name={vehicleTypeIcon(vehicleType)}
                    size={34}
                    color={colors.text2}
                  />
                  <Text style={styles.placeholderText}>{vehicleTypeLabel}</Text>
                </View>
              )}
              <View style={styles.badge}>
                <Icon name="pen" size={10} color={colors.bg0} />
              </View>
            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.sectionTitle}>{t("vehicles.vehicleType")}</Text>
            <View style={styles.typeSelector}>
              {(["motorcycle", "car", "other"] as VehicleType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    vehicleType === type && styles.typeOptionActive,
                  ]}
                  onPress={() => {
                    haptic.selection();
                    setVehicleType(type);
                  }}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={vehicleTypeIcon(type)}
                    size={20}
                    color={vehicleType === type ? colors.accent : colors.text2}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      vehicleType === type && styles.typeLabelActive,
                    ]}
                  >
                    {t(
                      `vehicles.vehicleType${type.charAt(0).toUpperCase() + type.slice(1)}` as any,
                    )}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInputField
            label={t("vehicles.make")}
            value={make}
            onChangeText={setMake}
            placeholder={t("vehicles.placeholderMake")}
            autoCapitalize="words"
            error={errors.make}
          />
          <TextInputField
            label={t("vehicles.model")}
            value={model}
            onChangeText={setModel}
            placeholder={t("vehicles.placeholderModel")}
            autoCapitalize="words"
            error={errors.model}
          />
          <View style={styles.row}>
            <TextInputField
              label={t("vehicles.year")}
              value={year}
              onChangeText={setYear}
              placeholder={t("vehicles.placeholderYear")}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
            <TextInputField
              label={t("vehicles.odometer")}
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="numeric"
              placeholder={t("vehicles.placeholderOdometer")}
              error={errors.odometer}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <TextInputField
            label={t("vehicles.nickname")}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t("vehicles.placeholderNickname")}
            autoCapitalize="words"
          />

          <View style={styles.sectionHeader}>
            <Icon name="gas-pump" size={13} color={colors.accent} />
            <Text style={styles.sectionTitle}>
              {t("vehicles.tankSettings")}
            </Text>
          </View>
          <Text style={styles.sectionHint}>
            {t("vehicles.tankSettingsHint")}
          </Text>
          <View style={styles.row}>
            <TextInputField
              label={t("vehicles.defaultTankSize") + " *"}
              value={defaultTankLiters}
              onChangeText={setDefaultTankLiters}
              keyboardType="decimal-pad"
              placeholder={t("vehicles.placeholderTankSize")}
              suffix="L"
              containerStyle={{ flex: 1 }}
              error={errors.tankLiters}
            />
            <TextInputField
              label={t("vehicles.defaultPrice")}
              value={defaultFuelPrice}
              onChangeText={setDefaultFuelPrice}
              keyboardType="decimal-pad"
              placeholder={t("vehicles.placeholderDefaultPrice")}
              suffix="CHF/L"
              containerStyle={{ flex: 1 }}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Icon name="bell" size={13} color={colors.accent} />
            <Text style={styles.sectionTitle}>
              {t("vehicles.serviceIntervals")}
            </Text>
          </View>
          <ServiceIntervalConfig
            serviceTypes={serviceTypes}
            intervals={serviceIntervals}
            onChange={setServiceIntervals}
          />

          <View style={styles.sectionHeader}>
            <Icon name="receipt" size={13} color={colors.accent} />
            <Text style={styles.sectionTitle}>
              {t("vehicles.paymentIntervals")}
            </Text>
          </View>
          <PaymentIntervalConfig
            paymentTypes={paymentTypes}
            intervals={paymentIntervals}
            onChange={setPaymentIntervals}
            onAdd={() =>
              setPaymentIntervals((prev) => [
                {
                  id: generateUUID(),
                  category: paymentTypes[0]?.id ?? "insurance",
                  amount: 0,
                  intervalType: "yearly",
                  intervalDays: 365,
                  startDateTs: Date.now(),
                  notes: null,
                },
                ...prev,
              ])
            }
          />
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <PrimaryButton
            label={
              isEditing
                ? t("common.saveChanges")
                : t("vehicles.addType", { type: vehicleTypeLabel })
            }
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </View>

      <AlertModal
        visible={deleteAlert}
        onClose={() => setDeleteAlert(false)}
        icon="trash-alt"
        iconColor={colors.dangerText}
        title={t("vehicles.deleteType", { type: vehicleTypeLabel })}
        message={t("vehicles.deleteVehicleMessage")}
        actions={[
          {
            label: t("common.cancel"),
            variant: "secondary",
            onPress: () => {},
          },
          {
            label: t("common.delete"),
            variant: "danger",
            onPress: async () => {
              haptic.error();
              await deleteVehicle(editId!);
              showToast({ titleKey: "toast.vehicleDeleted", variant: "info" });
              navigation.goBack();
            },
          },
        ]}
      />
      <AlertModal
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        icon="exclamation-triangle"
        iconColor={colors.dangerText}
        title={t("common.error")}
        message={errorAlert ?? ""}
        actions={[
          { label: t("common.ok"), variant: "secondary", onPress: () => {} },
        ]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 40 },
  row: { flexDirection: "row", gap: spacing.md },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border0,
    backgroundColor: colors.bg0,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  photoCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: spacing.lg,
    backgroundColor: colors.bg1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    elevation: 4,
  },
  photo: { width: "100%", height: "100%", borderRadius: 60 },
  placeholder: { alignItems: "center", justifyContent: "center", gap: 6 },
  placeholderText: { color: colors.text2, fontSize: typeScale.captionLarge },
  badge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: -spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.text0,
  },
  sectionHint: {
    fontSize: typeScale.captionLarge,
    color: colors.text2,
    marginBottom: -spacing.sm,
  },
  typeSelector: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  typeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.bg1,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  typeOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.bg2 ?? colors.bg1,
  },
  typeLabel: {
    fontSize: typeScale.captionLarge,
    color: colors.text2,
    fontWeight: "500",
  },
  typeLabelActive: { color: colors.accent, fontWeight: "600" },
});
