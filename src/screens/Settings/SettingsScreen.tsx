import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ToastAndroid,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import type { RootStackParamList } from "../../app/navigation/routes";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing, radius } from "../../theme/spacing";
import { useExport } from "../../hooks/useExport";
import Divider from "../components/Divider";
import AlertModal from "../components/AlertModal";
import LoadingOverlay from "../components/LoadingOverlay";
import { SettingsToggle } from "../components/SettingsToggle";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { useAppStore } from "../../store/appStore";
import { getDatabase } from "../../data/db/database";
import { SQLiteVehicleRepo } from "../../data/repositories/SQLiteVehicleRepo";
import { haptic, setHapticsEnabled } from "@/utils/haptics";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function generateConfirmCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface SettingsRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  right,
  danger,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Icon
          name={icon}
          size={14}
          color={danger ? colors.dangerText : colors.text1}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
          {label}
        </Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      {right ??
        (onPress ? (
          <Icon name="chevron-right" size={11} color={colors.text3} />
        ) : null)}
    </TouchableOpacity>
  );
}

type ModalState =
  | { type: "none" }
  | { type: "exportPasswordEntry" }
  | { type: "exportReady"; fileUri: string }
  | { type: "importPasswordEntry" }
  | { type: "deleteConfirm"; code: string }
  | { type: "result"; success: boolean; message: string };

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { exportDatabase, shareExportFile, importDatabase, clearAllData } =
    useExport();
  const setVehicles = useAppStore((s) => s.setVehicles);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);

  const [lang, setLang] = useState<"en" | "de">(
    (i18n.language?.slice(0, 2) as "en" | "de") ?? "en",
  );
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [keyInput, setKeyInput] = useState("");
  const [deleteInput, setDeleteInput] = useState("");
  const [loading, setLoading] = useState(false);

  const close = () => {
    setModal({ type: "none" });
    setKeyInput("");
    setDeleteInput("");
  };

  const toggleHaptics = (value: boolean) => {
    setHapticsOn(value);
    setHapticsEnabled(value);
    if (value) haptic.medium();
  };

  const changeLanguage = (value: "en" | "de") => {
    setLang(value);
    i18n.changeLanguage(value);
    haptic?.light?.();
  };

  const handleExport = () => setModal({ type: "exportPasswordEntry" });

  const handleExportWithPassword = async () => {
    if (!keyInput.trim()) return;
    setModal({ type: "none" });
    setKeyInput("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 50));
    const result = await exportDatabase(keyInput.trim());
    setLoading(false);
    if (result.success) {
      setModal({ type: "exportReady", fileUri: result.fileUri });
    } else {
      setModal({
        type: "result",
        success: false,
        message: result.error ?? t("settings.exportFailed"),
      });
    }
  };

  const handleShareExportFile = async (fileUri: string) => {
    const result = await shareExportFile(fileUri);
    close();
    if (!result.success) {
      setModal({
        type: "result",
        success: false,
        message: result.error ?? t("settings.exportFailed"),
      });
    }
  };

  const handleImport = async () => {
    if (!keyInput.trim()) return;
    setModal({ type: "none" });
    setKeyInput("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 50));
    const result = await importDatabase(keyInput.trim());
    setLoading(false);
    if (result.success) {
      try {
        const db = await getDatabase();
        const all = await new SQLiteVehicleRepo(db).getAll();
        setVehicles(all);
      } catch {}
      setModal({
        type: "result",
        success: true,
        message: t("settings.dataRestored"),
      });
    } else if (result.error !== "Cancelled") {
      setModal({
        type: "result",
        success: false,
        message: result.error ?? t("settings.importFailed"),
      });
    } else {
      close();
    }
  };

  const handleDeleteAll = async () => {
    if (modal.type !== "deleteConfirm") return;
    if (deleteInput.trim() !== modal.code) return;

    setLoading(true);
    const result = await clearAllData();
    setLoading(false);

    if (result.success) {
      setVehicles([]);
      setModal({
        type: "result",
        success: true,
        message: t("settings.deleteAllSuccess"),
      });
    } else {
      setModal({
        type: "result",
        success: false,
        message: result.error ?? t("settings.deleteAllFailed"),
      });
    }
  };

  const deleteConfirmMatch =
    modal.type === "deleteConfirm" && deleteInput.trim() === modal.code;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LoadingOverlay visible={loading} />
      <View style={styles.header}>
        <Text style={typography.h2}>{t("settings.title")}</Text>
        <Text style={typography.bodySmall}>{t("settings.subtitle")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t("settings.sectionData")}</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="list-ul"
            label={t("settings.manageServiceTypes")}
            sublabel={t("settings.manageServiceTypesHint")}
            onPress={() => navigation.navigate("ManageServiceTypes")}
          />
          <Divider />
          <SettingsRow
            icon="file-export"
            label={t("settings.exportData")}
            sublabel={t("settings.exportDataHint")}
            onPress={handleExport}
          />
          <Divider />
          <SettingsRow
            icon="file-import"
            label={t("settings.importData")}
            sublabel={t("settings.importDataHint")}
            onPress={() => setModal({ type: "importPasswordEntry" })}
          />
        </View>

        <Text style={styles.sectionLabel}>
          {t("settings.sectionPreferences")}
        </Text>
        <View style={styles.section}>
          <SettingsRow
            icon="mobile-alt"
            label={t("settings.hapticFeedback")}
            right={
              <Switch
                value={hapticsOn}
                onValueChange={toggleHaptics}
                trackColor={{ false: colors.bg4, true: colors.accent }}
                thumbColor={colors.white}
              />
            }
          />
          <Divider />
          <SettingsRow
            icon="globe"
            label={t("settings.language")}
            sublabel={t("settings.languageHint")}
            right={
              <SettingsToggle
                options={[
                  { label: "EN", value: "en" },
                  { label: "DE", value: "de" },
                ]}
                value={lang}
                onChange={changeLanguage}
              />
            }
          />
        </View>

        <Text style={styles.sectionLabel}>{t("settings.sectionPrivacy")}</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="lock"
            label={t("settings.dbEncryption")}
            sublabel={t("settings.dbEncryptionHint")}
            right={
              <View style={[styles.pill, styles.pillGood]}>
                <Text style={[styles.pillText, styles.pillTextGood]}>
                  {t("settings.statusOn")}
                </Text>
              </View>
            }
          />
          <Divider />
          <SettingsRow
            icon="wifi"
            label={t("settings.networkAccess")}
            sublabel={t("settings.networkAccessHint")}
            right={
              <View style={[styles.pill, styles.pillGood]}>
                <Text style={[styles.pillText, styles.pillTextGood]}>
                  {t("settings.statusNone")}
                </Text>
              </View>
            }
          />
          <Divider />
          <SettingsRow
            icon="database"
            label={t("settings.analytics")}
            sublabel={t("settings.analyticsHint")}
            right={
              <View style={[styles.pill, styles.pillGood]}>
                <Text style={[styles.pillText, styles.pillTextGood]}>
                  {t("settings.statusOff")}
                </Text>
              </View>
            }
          />
        </View>

        <Text style={styles.sectionLabel}>{t("settings.sectionAbout")}</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="info-circle"
            label={t("settings.about")}
            sublabel={t("settings.aboutVersion")}
            onPress={() => setAboutVisible(true)}
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelDanger]}>
          {t("settings.dangerZone")}
        </Text>
        <View style={[styles.section, styles.sectionDanger]}>
          <SettingsRow
            icon="trash-alt"
            label={t("settings.deleteAllData")}
            sublabel={t("settings.deleteAllDataHint")}
            danger
            onPress={() =>
              setModal({ type: "deleteConfirm", code: generateConfirmCode() })
            }
          />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <AlertModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        icon="shield-alt"
        iconColor={colors.accentText}
        title={t("settings.exportImportTitle")}
        message={t("settings.aboutMessage")}
        actions={[
          { label: t("common.ok"), variant: "primary", onPress: () => {} },
        ]}
      />

      {modal.type === "exportPasswordEntry" && (
        <AlertModal
          visible
          onClose={close}
          icon="lock"
          iconColor={colors.accentText}
          title={t("settings.exportPasswordTitle")}
          message={t("settings.exportPasswordMessage")}
          actions={[
            {
              label: t("common.cancel"),
              variant: "secondary",
              onPress: close,
              disabled: loading,
            },
            {
              label: t("settings.exportEncryptBtn"),
              variant: "primary",
              onPress: handleExportWithPassword,
              disabled: loading,
            },
          ]}
        >
          <TextInput
            style={styles.keyInput}
            value={keyInput}
            onChangeText={setKeyInput}
            placeholder={t("settings.passwordPlaceholder")}
            placeholderTextColor={colors.text3}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!loading}
          />
        </AlertModal>
      )}

      {modal.type === "exportReady" && (
        <AlertModal
          visible
          title={t("settings.exportReadyTitle")}
          onClose={close}
          icon="check-circle"
          iconColor={colors.successText}
          message={t("settings.exportReadyMessage")}
          actions={[
            { label: t("common.cancel"), variant: "secondary", onPress: close },
            {
              label: t("settings.exportSaveFile"),
              variant: "primary",
              onPress: () => handleShareExportFile(modal.fileUri),
            },
          ]}
        />
      )}

      {modal.type === "importPasswordEntry" && (
        <AlertModal
          visible
          onClose={close}
          icon="file-import"
          iconColor={colors.accentText}
          title={t("settings.importPasswordTitle")}
          message={t("settings.importPasswordMessage")}
          actions={[
            {
              label: t("common.cancel"),
              variant: "secondary",
              onPress: close,
              disabled: loading,
            },
            {
              label: t("settings.importAction"),
              variant: "primary",
              onPress: handleImport,
              disabled: loading,
            },
          ]}
        >
          <TextInput
            style={styles.keyInput}
            value={keyInput}
            onChangeText={setKeyInput}
            placeholder={t("settings.passwordPlaceholder")}
            placeholderTextColor={colors.text3}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!loading}
          />
        </AlertModal>
      )}

      {modal.type === "deleteConfirm" && (
        <AlertModal
          visible
          onClose={close}
          icon="exclamation-triangle"
          iconColor={colors.dangerText}
          title={t("settings.deleteAllDataTitle")}
          message={t("settings.deleteAllDataMessage")}
          actions={[
            {
              label: t("common.cancel"),
              variant: "secondary",
              onPress: close,
            },
            {
              label: loading ? "..." : t("settings.deleteAllDataAction"),
              variant: "danger",
              onPress: handleDeleteAll,
              disabled: !deleteConfirmMatch,
            },
          ]}
        >
          <View style={styles.deleteCodeBox}>
            <Text style={styles.deleteCode} selectable>
              {modal.code}
            </Text>
          </View>
          <TextInput
            style={[
              styles.keyInput,
              { marginTop: spacing.sm },
              deleteConfirmMatch && styles.keyInputValid,
            ]}
            value={deleteInput}
            onChangeText={setDeleteInput}
            placeholder={t("settings.deleteAllDataConfirmPlaceholder")}
            placeholderTextColor={colors.text3}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </AlertModal>
      )}

      <AlertModal
        visible={modal.type === "result"}
        onClose={close}
        icon={
          modal.type === "result" && modal.success
            ? "check-circle"
            : "exclamation-triangle"
        }
        iconColor={
          modal.type === "result" && modal.success
            ? colors.successText
            : colors.dangerText
        }
        title={
          modal.type === "result" && modal.success
            ? t("common.ok")
            : t("common.error")
        }
        message={modal.type === "result" ? modal.message : ""}
        actions={[
          {
            label: t("common.ok"),
            variant:
              modal.type === "result" && modal.success
                ? "primary"
                : "secondary",
            onPress: close,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  scroll: { padding: spacing.lg, paddingBottom: 60, gap: spacing.sm },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  sectionLabelDanger: { color: colors.dangerText },
  section: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    overflow: "hidden",
  },
  sectionDanger: {
    borderColor: colors.danger,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowIconDanger: { backgroundColor: colors.dangerMuted },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "500", color: colors.text0 },
  rowLabelDanger: { color: colors.dangerText },
  rowSub: { fontSize: 12, color: colors.text2, marginTop: 2 },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.bg3,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text2,
    letterSpacing: 0.5,
  },
  pillGood: { backgroundColor: colors.successMuted },
  pillTextGood: { color: colors.successText },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.successMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.successText,
    lineHeight: 18,
  },
  keyBox: {
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg4,
    borderRadius: radius.sm,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accent,
  },
  keyText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: colors.accent,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  keyInput: {
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border1,
    color: colors.text0,
    fontSize: 12,
    padding: spacing.md,
    fontFamily: "monospace",
    marginTop: spacing.sm,
    minHeight: 56,
    width: "90%",
  },
  keyInputValid: {
    borderColor: colors.success,
  },
  deleteCodeBox: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: "center",
    width: "90%",
  },
  deleteCode: {
    fontSize: 20,
    fontFamily: "monospace",
    color: colors.dangerText,
    fontWeight: "700",
    letterSpacing: 3,
  },
});
