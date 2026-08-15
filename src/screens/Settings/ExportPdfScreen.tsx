import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { haptic } from "@/utils/haptics";
import { RootStackParamList } from "@/app/navigation/routes";
import { useVehicles } from "@/hooks/useVehicles";
import { usePdfExport, type PdfExportOptions } from "@/hooks/usePdfExport";
import ScreenHeader from "../components/ScreenHeader";
import LoadingOverlay from "../components/LoadingOverlay";
import { formatVehicleName } from "@/utils/format";
import PrimaryButton from "../components/PrimaryButton";
import AlertModal from "../components/AlertModal";
import { radius, spacing } from "@/theme/spacing";
import { colors } from "@/theme/colors";
import { typography, typeScale } from "@/theme/typography";
import { FontAwesome5 as Icon } from "@expo/vector-icons";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ExportPdfScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { vehicles } = useVehicles();
  const { generatePdf, shareGeneratedPdf } = usePdfExport();

  const [vehicleId, setVehicleId] = useState<string | null>(
    vehicles[0]?.id ?? null,
  );
  const [includeService, setIncludeService] = useState(true);
  const [includeFuel, setIncludeFuel] = useState(true);
  const [includeCosts, setIncludeCosts] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(false);
  const [includeCostValues, setIncludeCostValues] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const nothingSelected = !includeService && !includeFuel && !includeCosts;

  const handleGenerate = async () => {
    if (!vehicleId || nothingSelected) return;
    haptic.light();
    setLoading(true);
    const options: PdfExportOptions = {
      vehicleId,
      includeService,
      includeFuel,
      includeCosts,
      includePhotos,
      includeCostValues,
      includeNotes,
    };
    const result = await generatePdf(options);
    if (!result.success) {
      setLoading(false);
      haptic.error();
      setErrorMsg(result.error);
      return;
    }
    const shareResult = await shareGeneratedPdf(result.fileUri);
    setLoading(false);
    if (!shareResult.success) {
      haptic.error();
      setErrorMsg(shareResult.error ?? "Failed to share PDF");
    } else {
      haptic.success();
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LoadingOverlay visible={loading} />
      <ScreenHeader title={t("settings.exportPdf")} showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t("vehicles.title")}</Text>
        <View style={styles.section}>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={styles.vehicleRow}
              onPress={() => {
                haptic.selection();
                setVehicleId(v.id);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[styles.radio, vehicleId === v.id && styles.radioActive]}
              >
                {vehicleId === v.id && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.vehicleName}>
                {formatVehicleName(v.make, v.model, v.nickname)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t("settings.pdfContent")}</Text>
        <View style={styles.section}>
          <OptionRow
            icon="tools"
            label={t("history.title")}
            value={includeService}
            onChange={setIncludeService}
          />
          <OptionRow
            icon="gas-pump"
            label={t("vehicles.fuel")}
            value={includeFuel}
            onChange={setIncludeFuel}
          />
          <OptionRow
            icon="receipt"
            label={t("payments.historyTitle")}
            value={includeCosts}
            onChange={setIncludeCosts}
          />
          <OptionRow
            icon="images"
            label={t("addEntry.photos")}
            value={includePhotos}
            onChange={setIncludePhotos}
          />
        </View>

        <Text style={styles.sectionLabel}>{t("settings.pdfDetails")}</Text>
        <View style={styles.section}>
          <OptionRow
            icon="euro-sign"
            label={t("settings.pdfIncludeCosts")}
            value={includeCostValues}
            onChange={setIncludeCostValues}
          />
          <OptionRow
            icon="align-left"
            label={t("settings.pdfIncludeNotes")}
            value={includeNotes}
            onChange={setIncludeNotes}
          />
        </View>

        {nothingSelected && (
          <Text style={styles.warning}>
            {t("settings.pdfSelectAtLeastOne")}
          </Text>
        )}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <PrimaryButton
          label={t("settings.exportPdf")}
          onPress={handleGenerate}
          disabled={!vehicleId || nothingSelected}
        />
      </View>

      <AlertModal
        visible={!!errorMsg}
        onClose={() => setErrorMsg(null)}
        icon="exclamation-triangle"
        iconColor={colors.dangerText}
        title={t("common.error")}
        message={errorMsg ?? ""}
        actions={[
          { label: t("common.ok"), variant: "secondary", onPress: () => {} },
        ]}
      />
    </View>
  );
}

function OptionRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <View style={styles.optionIcon}>
        <Icon name={icon} size={13} color={colors.accent} />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.bg4, true: colors.accent }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { padding: spacing.lg, paddingBottom: 40, gap: spacing.sm },
  sectionLabel: {
    ...typography.overline,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  section: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    overflow: "hidden",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border1,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: colors.accent },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  vehicleName: { fontSize: typeScale.bodyMedium, fontWeight: "500", color: colors.text0 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 52,
  },
  optionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    flex: 1,
    fontSize: typeScale.bodyMedium,
    fontWeight: "500",
    color: colors.text0,
  },
  warning: {
    fontSize: typeScale.captionLarge,
    color: colors.dangerText,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border0,
    backgroundColor: colors.bg0,
  },
});
