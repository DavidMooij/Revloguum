import { useCallback, useEffect, useState } from "react";
import { getDatabase } from "@/data/db/database";
import { SQLiteNotificationSettingsRepo } from "@/data/repositories/SQLiteNotificationSettingsRepo";
import type {
  NotificationSetting,
  NotificationSettingKind,
  NotificationSettingsBundle,
} from "@/domain/entities/NotificationSettings";
import { defaultNotificationSettings } from "@/domain/entities/NotificationSettings";
import { syncNotifications } from "@/notifications/syncNotifications";

type EditableNotificationSetting = Pick<
  NotificationSetting,
  "enabled" | "offsetDays" | "offsetKm" | "repeatEveryDays"
>;

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsBundle>(
    defaultNotificationSettings(),
  );
  const [initialSettings, setInitialSettings] =
    useState<NotificationSettingsBundle>(defaultNotificationSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const settingsFingerprint = (value: NotificationSettingsBundle) =>
    JSON.stringify({
      p: {
        e: value.payments.enabled,
        o: value.payments.offsetDays,
        k: value.payments.offsetKm,
        r: value.payments.repeatEveryDays,
      },
      u: {
        e: value.upcomingServices.enabled,
        o: value.upcomingServices.offsetDays,
        k: value.upcomingServices.offsetKm,
        r: value.upcomingServices.repeatEveryDays,
      },
      o: {
        e: value.overdueServices.enabled,
        d: value.overdueServices.offsetDays,
        k: value.overdueServices.offsetKm,
        r: value.overdueServices.repeatEveryDays,
      },
    });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const repo = new SQLiteNotificationSettingsRepo(db);
      const loaded = await repo.getAll();
      setSettings(loaded);
      setInitialSettings(loaded);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateLocal = useCallback(
    (
      kind: NotificationSettingKind,
      patch: Partial<EditableNotificationSetting>,
    ) => {
      setSettings((prev) => {
        const next = { ...prev };

        if (kind === "payments") {
          next.payments = { ...next.payments, ...patch };
        } else if (kind === "upcoming_services") {
          next.upcomingServices = { ...next.upcomingServices, ...patch };
        } else {
          next.overdueServices = { ...next.overdueServices, ...patch };
        }

        return next;
      });
    },
    [],
  );

  const hasChanges =
    settingsFingerprint(settings) !== settingsFingerprint(initialSettings);

  const saveAll = useCallback(async (): Promise<boolean> => {
    if (!hasChanges) return false;

    setSaving(true);
    try {
      const db = await getDatabase();
      const repo = new SQLiteNotificationSettingsRepo(db);

      await repo.upsert("payments", {
        enabled: settings.payments.enabled,
        offsetDays: settings.payments.offsetDays,
        offsetKm: settings.payments.offsetKm,
        repeatEveryDays: settings.payments.repeatEveryDays,
      });

      await repo.upsert("upcoming_services", {
        enabled: settings.upcomingServices.enabled,
        offsetDays: settings.upcomingServices.offsetDays,
        offsetKm: settings.upcomingServices.offsetKm,
        repeatEveryDays: settings.upcomingServices.repeatEveryDays,
      });

      await repo.upsert("overdue_services", {
        enabled: settings.overdueServices.enabled,
        offsetDays: settings.overdueServices.offsetDays,
        offsetKm: settings.overdueServices.offsetKm,
        repeatEveryDays: settings.overdueServices.repeatEveryDays,
      });

      await syncNotifications();
      setInitialSettings(settings);
      return true;
    } finally {
      setSaving(false);
    }
  }, [hasChanges, settings]);

  return {
    settings,
    loading,
    saving,
    hasChanges,
    reload: load,
    updateLocal,
    saveAll,
  };
}
