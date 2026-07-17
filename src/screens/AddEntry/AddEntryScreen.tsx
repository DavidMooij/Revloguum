import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { useServiceEntryActions } from "../../hooks/useServiceHistory";
import { useVehicles } from "../../hooks/useVehicles";
import { getDatabase } from "../../data/db/database";
import { SQLiteServiceEntryRepo } from "../../data/repositories/SQLiteServiceEntryRepo";
import ServiceTypePicker from "./components/ServiceTypePicker";
import DatePickerField from "./components/DatePickerField";
import TextInputField from "../components/TextInputField";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import AlertModal from "../components/AlertModal";
import { haptic } from "@/utils/haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { FontAwesome5 as Icon } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "AddEntry">;

export default function AddEntryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props["route"]>();
  const { vehicleId, editEntryId } = route.params ?? {};

  const { serviceTypes } = useServiceTypes();
  const { addEntry, updateEntry } = useServiceEntryActions();
  const { vehicles, activeVehicleId } = useVehicles();

  const resolvedMotoId =
    vehicleId ?? activeVehicleId ?? vehicles[0]?.id ?? "";

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [dateTs, setDateTs] = useState(Date.now());
  const [odometer, setOdometer] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ type?: string; odometer?: string }>(
    {},
  );
  const [images, setImages] = useState<string[]>([]);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [cameraAlert, setCameraAlert] = useState(false);

  const isEditing = !!editEntryId;

  useEffect(() => {
    if (isEditing || !resolvedMotoId) return;
    (async () => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const last = await repo.getLastForVehicle(resolvedMotoId);
      if (last) setOdometer(String(last.odometerKm + 1));
    })();
  }, [resolvedMotoId, isEditing]);

  useEffect(() => {
    if (!editEntryId) return;
    (async () => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const entry = await repo.getById(editEntryId);
      if (!entry) return;
      setSelectedTypeId(entry.serviceTypeId);
      setDateTs(entry.dateTs);
      setOdometer(String(entry.odometerKm));
      setCost(entry.cost != null ? String(entry.cost) : "");
      setNotes(entry.notes ?? "");
      setImages(entry.imagePaths ?? []);
    })();
  }, [editEntryId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setCameraAlert(true);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const validate = useCallback(() => {
    const errs: typeof errors = {};
    if (!selectedTypeId) errs.type = t('addEntry.errorTypeRequired');
    const odo = parseInt(odometer, 10);
    if (!odometer || isNaN(odo) || odo < 0)
      errs.odometer = t('addEntry.errorOdometerRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [selectedTypeId, odometer]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      haptic.error();
      return;
    }
    haptic.light();
    setSaving(true);
    try {
      const parsedOdo = parseInt(odometer, 10);
      const parsedCost = cost.trim() ? parseFloat(cost) : null;
      if (isEditing && editEntryId) {
        await updateEntry(editEntryId, {
          serviceTypeId: selectedTypeId!,
          dateTs,
          odometerKm: parsedOdo,
          cost: parsedCost,
          notes: notes.trim() || null,
          imagePaths: images.length > 0 ? images : [],
        });
      } else {
        await addEntry({
          vehicleId: resolvedMotoId,
          serviceTypeId: selectedTypeId!,
          dateTs,
          odometerKm: parsedOdo,
          cost: parsedCost,
          notes: notes.trim() || null,
          imagePaths: images.length > 0 ? images : [],
        });
      }
      haptic.success();
      navigation.goBack();
    } catch (e) {
      haptic.error();
      setErrorAlert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [
    validate,
    odometer,
    cost,
    notes,
    selectedTypeId,
    dateTs,
    resolvedMotoId,
    isEditing,
    editEntryId,
    addEntry,
    updateEntry,
    navigation,
    images,
  ]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader
          title={isEditing ? t('addEntry.editTitle') : t('addEntry.title')}
          showBack
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.caption, styles.sectionLabel]}>
            {t('entryDetail.service')}
          </Text>
          <ServiceTypePicker
            serviceTypes={serviceTypes}
            selectedId={selectedTypeId}
            onSelect={setSelectedTypeId}
          />
          {errors.type ? <Text style={styles.error}>{errors.type}</Text> : null}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInputField
                label={t('addEntry.odometer')}
                value={odometer}
                onChangeText={setOdometer}
                keyboardType="numeric"
                placeholder={t('addEntry.placeholderOdometer')}
                suffix="km"
                error={errors.odometer}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInputField
                label={t('addEntry.cost')}
                value={cost}
                onChangeText={setCost}
                keyboardType="decimal-pad"
                placeholder={t('addEntry.placeholderCost')}
                suffix="CHF"
              />
            </View>
          </View>

          <DatePickerField value={dateTs} onChange={setDateTs} />

          <TextInputField
            label={t('addEntry.notes')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('addEntry.placeholderNotes')}
            multiline
            numberOfLines={3}
            containerStyle={styles.notesField}
          />

          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>{t('addEntry.photos')}</Text>
            <View style={styles.imageRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageWrapper}>
                  <Image source={uri} style={styles.image} contentFit="cover" />
                  <TouchableOpacity
                    onPress={() =>
                      setImages((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={pickImage} style={styles.addTile}>
                <Icon name="images" size={18} color={colors.text2} />
                <Text style={styles.addText}>{t('addEntry.gallery')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.addTile}>
                <Icon name="camera" size={18} color={colors.text2} />
                <Text style={styles.addText}>{t('addEntry.camera')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <PrimaryButton
            label={isEditing ? t('addEntry.saveChanges') : t('addEntry.saveEntry')}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </View>

      <AlertModal
        visible={cameraAlert}
        onClose={() => setCameraAlert(false)}
        icon="camera"
        iconColor={colors.warningText}
        title={t('addEntry.cameraPermission')}
        message={t('addEntry.cameraPermissionMessage')}
        actions={[{ label: t('common.ok'), variant: "secondary", onPress: () => {} }]}
      />

      <AlertModal
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        icon="exclamation-triangle"
        iconColor={colors.dangerText}
        title={t('common.error')}
        message={errorAlert ?? ""}
        actions={[{ label: t('common.ok'), variant: "secondary", onPress: () => {} }]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 40 },
  sectionLabel: { marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.md },
  error: { color: colors.dangerText, fontSize: 12, marginTop: spacing.xs },
  notesField: { minHeight: 100 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border0,
    backgroundColor: colors.bg0,
  },
  imageSection: { marginTop: spacing.md },
  imageLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  imageWrapper: {
    width: 86,
    height: 86,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.bg2,
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: "white",
    fontSize: 14,
    lineHeight: 14,
    fontWeight: "700",
  },
  addTile: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: colors.bg1,
    borderWidth: 1,
    borderColor: colors.border0,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addText: { fontSize: 11, color: colors.text2, fontWeight: "500" },
});
