import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/screens/components/ScreenHeader";
import SettingsRow from "@/screens/components/SettingsRow";
import { SettingsToggle } from "@/screens/components/SettingsToggle";
import PrimaryButton from "@/screens/components/PrimaryButton";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";
import { readableColor } from "@/theme/readability";
import { useAppStore } from "@/store/appStore";
import { useFeedback } from "@/screens/components/feedback/Feedbackprovider";

type RepeatPreset = "daily" | "threeDays" | "weekly" | "custom";

function presetFromDays(days: number): RepeatPreset {
  if (days === 1) return "daily";
  if (days === 3) return "threeDays";
  if (days === 7) return "weekly";
  return "custom";
}

function daysFromPreset(preset: RepeatPreset, customRaw: string): number {
  if (preset === "daily") return 1;
  if (preset === "threeDays") return 3;
  if (preset === "weekly") return 7;

  const parsed = Number.parseInt(customRaw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

interface SettingCardProps {
  title: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  offsetDaysLabel: string;
  offsetDaysValue: number;
  onOffsetDaysChange: (next: number) => void;
  offsetKmLabel?: string;
  offsetKmValue?: number;
  onOffsetKmChange?: (next: number) => void;
  repeatEveryDays: number;
  onRepeatEveryDaysChange: (next: number) => void;
}

function SettingCard({
  title,
  enabled,
  onEnabledChange,
  offsetDaysLabel,
  offsetDaysValue,
  onOffsetDaysChange,
  offsetKmLabel,
  offsetKmValue,
  onOffsetKmChange,
  repeatEveryDays,
  onRepeatEveryDaysChange,
}: SettingCardProps) {
  const { t } = useTranslation();
  const readabilityMode = useAppStore((s) => s.readabilityMode);

  const initialPreset = useMemo(
    () => presetFromDays(repeatEveryDays),
    [repeatEveryDays],
  );
  const [preset, setPreset] = useState<RepeatPreset>(initialPreset);
  const [customRepeatRaw, setCustomRepeatRaw] = useState(
    String(repeatEveryDays),
  );
  const [offsetDaysRaw, setOffsetDaysRaw] = useState(String(offsetDaysValue));
  const [offsetKmRaw, setOffsetKmRaw] = useState(String(offsetKmValue ?? 0));

  return (
    <View style={styles.card}>
      <SettingsRow
        icon="bell"
        label={title}
        right={
          <Switch
            value={enabled}
            onValueChange={onEnabledChange}
            trackColor={{
              false: readableColor("bg4", readabilityMode),
              true: readableColor("accent", readabilityMode),
            }}
            thumbColor={colors.white}
          />
        }
      />

      <View style={styles.inner}>
        <Text style={styles.label}>{offsetDaysLabel}</Text>
        <TextInput
          value={offsetDaysRaw}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, "");
            setOffsetDaysRaw(cleaned);
            const parsed = Number.parseInt(cleaned, 10);
            onOffsetDaysChange(
              Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
            );
          }}
          keyboardType="number-pad"
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.text2}
        />

        {offsetKmLabel && onOffsetKmChange ? (
          <>
            <Text style={[styles.label, { marginTop: spacing.md }]}>
              {offsetKmLabel}
            </Text>
            <TextInput
              value={offsetKmRaw}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "");
                setOffsetKmRaw(cleaned);
                const parsed = Number.parseInt(cleaned, 10);
                onOffsetKmChange(
                  Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
                );
              }}
              keyboardType="number-pad"
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.text2}
            />
          </>
        ) : null}

        <Text style={[styles.label, { marginTop: spacing.md }]}>
          {t("notifications.repeat")}
        </Text>

        <SettingsToggle
          fullWidth
          options={[
            { label: t("notifications.repeatDaily"), value: "daily" },
            { label: t("notifications.repeatThreeDays"), value: "threeDays" },
            { label: t("notifications.repeatWeekly"), value: "weekly" },
            { label: t("notifications.repeatCustom"), value: "custom" },
          ]}
          value={preset}
          onChange={(next) => {
            setPreset(next);
            const resolved = daysFromPreset(next, customRepeatRaw);
            onRepeatEveryDaysChange(resolved);
          }}
        />

        {preset === "custom" ? (
          <TextInput
            value={customRepeatRaw}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "");
              setCustomRepeatRaw(cleaned);
              const parsed = Number.parseInt(cleaned, 10);
              onRepeatEveryDaysChange(
                Number.isFinite(parsed) ? Math.max(1, parsed) : 1,
              );
            }}
            keyboardType="number-pad"
            style={[styles.input, { marginTop: spacing.sm }]}
            placeholder="1"
            placeholderTextColor={colors.text2}
          />
        ) : null}
      </View>
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();
  const { settings, loading, saving, hasChanges, updateLocal, saveAll } =
    useNotificationSettings();

  const handleSave = async () => {
    const saved = await saveAll();
    if (saved) {
      showToast({ titleKey: "toast.settingsSaved", variant: "success" });
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader title={t("notifications.title")} showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SettingCard
          title={t("notifications.payments")}
          enabled={settings.payments.enabled}
          onEnabledChange={(enabled) => updateLocal("payments", { enabled })}
          offsetDaysLabel={t("notifications.daysBefore")}
          offsetDaysValue={settings.payments.offsetDays}
          onOffsetDaysChange={(offsetDays) =>
            updateLocal("payments", { offsetDays })
          }
          repeatEveryDays={settings.payments.repeatEveryDays}
          onRepeatEveryDaysChange={(repeatEveryDays) =>
            updateLocal("payments", { repeatEveryDays })
          }
        />

        <SettingCard
          title={t("notifications.upcomingServices")}
          enabled={settings.upcomingServices.enabled}
          onEnabledChange={(enabled) =>
            updateLocal("upcoming_services", { enabled })
          }
          offsetDaysLabel={t("notifications.daysBefore")}
          offsetDaysValue={settings.upcomingServices.offsetDays}
          onOffsetDaysChange={(offsetDays) =>
            updateLocal("upcoming_services", { offsetDays })
          }
          offsetKmLabel={t("notifications.kmBefore")}
          offsetKmValue={settings.upcomingServices.offsetKm}
          onOffsetKmChange={(offsetKm) =>
            updateLocal("upcoming_services", { offsetKm })
          }
          repeatEveryDays={settings.upcomingServices.repeatEveryDays}
          onRepeatEveryDaysChange={(repeatEveryDays) =>
            updateLocal("upcoming_services", { repeatEveryDays })
          }
        />

        <SettingCard
          title={t("notifications.overdueServices")}
          enabled={settings.overdueServices.enabled}
          onEnabledChange={(enabled) =>
            updateLocal("overdue_services", { enabled })
          }
          offsetDaysLabel={t("notifications.daysAfterDue")}
          offsetDaysValue={settings.overdueServices.offsetDays}
          onOffsetDaysChange={(offsetDays) =>
            updateLocal("overdue_services", { offsetDays })
          }
          offsetKmLabel={t("notifications.kmAfterDue")}
          offsetKmValue={settings.overdueServices.offsetKm}
          onOffsetKmChange={(offsetKm) =>
            updateLocal("overdue_services", { offsetKm })
          }
          repeatEveryDays={settings.overdueServices.repeatEveryDays}
          onRepeatEveryDaysChange={(repeatEveryDays) =>
            updateLocal("overdue_services", { repeatEveryDays })
          }
        />
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <PrimaryButton
          label={t("common.saveChanges")}
          onPress={handleSave}
          loading={saving}
          disabled={!hasChanges}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: colors.bg1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border1,
    overflow: "hidden",
  },
  inner: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text2,
    marginBottom: spacing.xs,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border1,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
    color: colors.text0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border0,
    backgroundColor: colors.bg0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
