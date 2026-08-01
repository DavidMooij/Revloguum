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
import { typography, typeScale } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import { useServiceTypes } from "../../hooks/useServiceTypes";
import { useServiceEntryActions } from "../../hooks/useServiceHistory";
import { useVehicles } from "../../hooks/useVehicles";
import { getDatabase } from "../../data/db/database";
import { SQLiteServiceEntryRepo } from "../../data/repositories/SQLiteServiceEntryRepo";
import { generateUUID } from "../../utils/uuid";
import ServiceBlockEditor, {
  type ServiceBlock,
} from "./components/ServiceBlockEditor";
import DatePickerField from "./components/DatePickerField";
import TextInputField from "../components/TextInputField";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import AlertModal from "../components/AlertModal";
import { haptic } from "@/utils/haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import { decryptImage, encryptImage } from "@/security/imageEncryption";
import { useFeedback } from "../components/feedback/Feedbackprovider";

type Props = NativeStackScreenProps<RootStackParamList, "AddEntry">;

export default function AddEntryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props["route"]>();
  const { vehicleId, editEntryId } = route.params ?? {};

  const { serviceTypes } = useServiceTypes();
  const { addGroup, deleteGroup, deleteEntry } = useServiceEntryActions();
  const { vehicles, activeVehicleId } = useVehicles();

  const resolvedMotoId = vehicleId ?? activeVehicleId ?? vehicles[0]?.id ?? "";

  const [blocks, setBlocks] = useState<ServiceBlock[]>([
    { key: generateUUID(), serviceTypeId: null, cost: "", notes: "" },
  ]);
  const [dateTs, setDateTs] = useState(Date.now());
  const [odometer, setOdometer] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ blocks?: string; odometer?: string }>(
    {},
  );
  const [images, setImages] = useState<string[]>([]);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [cameraAlert, setCameraAlert] = useState(false);
  const isEditing = !!editEntryId;
  const [displayUris, setDisplayUris] = useState<Record<string, string>>({});
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const { showToast, showCelebration } = useFeedback();

  const updateBlock = useCallback(
    (key: string, patch: Partial<ServiceBlock>) => {
      setBlocks((prev) =>
        prev.map((b) => (b.key === key ? { ...b, ...patch } : b)),
      );
    },
    [],
  );
  const addBlock = () =>
    setBlocks((prev) => [
      ...prev,
      { key: generateUUID(), serviceTypeId: null, cost: "", notes: "" },
    ]);
  const removeBlock = (key: string) =>
    setBlocks((prev) => prev.filter((b) => b.key !== key));

  useEffect(() => {
    if (isEditing || !resolvedMotoId) return;
    (async () => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const last = await repo.getLastForVehicle(resolvedMotoId);
      if (last) setOdometer(String(last.odometerKm + 1));
    })();
  }, [resolvedMotoId, isEditing]);

  const getEncryptedImages = useCallback(async (uris: string[]) => {
    return Promise.all(
      uris.map((uri) => (uri.endsWith(".enc") ? uri : encryptImage(uri))),
    );
  }, []);

  useEffect(() => {
    if (!editEntryId) return;
    (async () => {
      const db = await getDatabase();
      const repo = new SQLiteServiceEntryRepo(db);
      const entry = await repo.getById(editEntryId);
      if (!entry) return;
      setDateTs(entry.dateTs);
      setOdometer(String(entry.odometerKm));
      setImages(entry.imagePaths ?? []);
      setEditVehicleId(entry.vehicleId);
      if (entry.groupId) {
        const groupItems = await repo.getGroup(entry.groupId);
        setEditGroupId(entry.groupId);
        setBlocks(
          groupItems.map((g) => ({
            key: g.id,
            serviceTypeId: g.serviceTypeId,
            cost: g.cost != null ? String(g.cost) : "",
            notes: g.notes ?? "",
          })),
        );
      } else {
        setBlocks([
          {
            key: entry.id,
            serviceTypeId: entry.serviceTypeId,
            cost: entry.cost != null ? String(entry.cost) : "",
            notes: entry.notes ?? "",
          },
        ]);
      }
    })();
  }, [editEntryId]);

  useEffect(() => {
    let cancelled = false;

    async function loadImages() {
      const result: Record<string, string> = {};

      for (const path of images) {
        try {
          if (path.endsWith(".enc")) {
            result[path] = await decryptImage(path);
          } else {
            result[path] = path;
          }
        } catch (e) {
          console.warn("Failed to decrypt image:", path, e);
        }
      }

      if (!cancelled) {
        setDisplayUris(result);
      }
    }
    if (images.length > 0) {
      loadImages();
    }
    return () => {
      cancelled = true;
    };
  }, [images]);

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
    const errs: { blocks?: string; odometer?: string } = {};
    if (!blocks.some((b) => b.serviceTypeId))
      errs.blocks = t("addEntry.errorTypeRequired");
    const odo = parseInt(odometer, 10);
    if (!odometer || isNaN(odo) || odo < 0)
      errs.odometer = t("addEntry.errorOdometerRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [blocks, odometer, t]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      haptic.error();
      return;
    }
    haptic.light();
    setSaving(true);
    try {
      const parsedOdo = parseInt(odometer, 10);
      const encryptedImages = await getEncryptedImages(images);
      const items = blocks
        .filter((b) => b.serviceTypeId)
        .map((b) => ({
          serviceTypeId: b.serviceTypeId!,
          cost: b.cost.trim() ? parseFloat(b.cost) : null,
          notes: b.notes.trim() || null,
        }));

      if (isEditing) {
        if (editGroupId) await deleteGroup(editGroupId);
        else if (editEntryId) await deleteEntry(editEntryId);
      }

      let isFirstServiceEver = false;
      if (!isEditing) {
        const db = await getDatabase();
        const countRow = await db.getFirstAsync<{ c: number }>(
          "SELECT COUNT(*) as c FROM service_entries;",
        );
        isFirstServiceEver = (countRow?.c ?? 0) === 0;
      }

      await addGroup(
        {
          vehicleId: isEditing
            ? (editVehicleId ?? resolvedMotoId)
            : resolvedMotoId,
          dateTs,
          odometerKm: parsedOdo,
          imagePaths: encryptedImages,
        },
        items,
      );
      haptic.success();

      if (isFirstServiceEver) {
        showCelebration({
          titleKey: "celebration.firstService.title",
          subtitleKey: "celebration.firstService.subtitle",
          variant: "milestone",
        });
      } else {
        showToast({
          titleKey: isEditing ? "toast.serviceUpdated" : "toast.serviceAdded",
          variant: "success",
        });
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
    odometer,
    blocks,
    images,
    getEncryptedImages,
    isEditing,
    editGroupId,
    editEntryId,
    editVehicleId,
    resolvedMotoId,
    dateTs,
    addGroup,
    deleteGroup,
    deleteEntry,
    navigation,
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
          title={isEditing ? t("addEntry.editTitle") : t("addEntry.title")}
          showBack
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.caption, styles.sectionLabel]}>
            {t("entryDetail.service")}
          </Text>

          <View style={styles.blocks}>
            {blocks.map((block, i) => (
              <ServiceBlockEditor
                key={block.key}
                index={i}
                block={block}
                serviceTypes={serviceTypes}
                canRemove={blocks.length > 1}
                onChange={(patch) => updateBlock(block.key, patch)}
                onRemove={() => removeBlock(block.key)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.addBlock}
            onPress={addBlock}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={13} color={colors.accent} />
            <Text style={styles.addBlockText}>{t("addEntry.addService")}</Text>
          </TouchableOpacity>
          {errors.blocks ? (
            <Text style={styles.error}>{errors.blocks}</Text>
          ) : null}

          <TextInputField
            label={t("addEntry.odometer")}
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            placeholder={t("addEntry.placeholderOdometer")}
            suffix="km"
            error={errors.odometer}
          />

          <DatePickerField value={dateTs} onChange={setDateTs} />

          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>{t("addEntry.photos")}</Text>
            <View style={styles.imageRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageWrapper}>
                  <Image
                    source={{
                      uri: displayUris[uri] ?? uri,
                    }}
                    style={styles.image}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setImages((prev) => prev.filter((_, idx) => idx !== i));

                      setDisplayUris((prev) => {
                        const copy = { ...prev };
                        delete copy[uri];
                        return copy;
                      });
                    }}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={pickImage} style={styles.addTile}>
                <Icon name="images" size={18} color={colors.text2} />
                <Text style={styles.addText}>{t("addEntry.gallery")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.addTile}>
                <Icon name="camera" size={18} color={colors.text2} />
                <Text style={styles.addText}>{t("addEntry.camera")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <PrimaryButton
            label={
              isEditing ? t("addEntry.saveChanges") : t("addEntry.saveEntry")
            }
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
        title={t("addEntry.cameraPermission")}
        message={t("addEntry.cameraPermissionMessage")}
        actions={[
          { label: t("common.ok"), variant: "secondary", onPress: () => {} },
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
  sectionLabel: { marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.md },
  blocks: { gap: spacing.md },
  addBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    borderStyle: "dashed",
    backgroundColor: colors.bg1,
  },
  addBlockText: {
    fontSize: typeScale.bodySmall,
    fontWeight: "600",
    color: colors.accent,
  },
  error: {
    color: colors.dangerText,
    fontSize: typeScale.captionLarge,
    marginTop: spacing.xs,
  },
  notesField: { minHeight: 100 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border0,
    backgroundColor: colors.bg0,
  },
  imageSection: { marginTop: spacing.md },
  imageLabel: {
    ...typography.caption,
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
    fontSize: typeScale.bodyMedium,
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
  addText: {
    fontSize: typeScale.caption,
    color: colors.text2,
    fontWeight: "500",
  },
});
