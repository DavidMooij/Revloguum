import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getDatabase } from "@/data/db/database";
import { SQLiteNotificationSettingsRepo } from "@/data/repositories/SQLiteNotificationSettingsRepo";
import { SQLiteVehicleRepo } from "@/data/repositories/SQLiteVehicleRepo";
import { SQLiteVehicleCostRepo } from "@/data/repositories/SQLiteVehicleCostRepo";
import { SQLiteServiceEntryRepo } from "@/data/repositories/SQLiteServiceEntryRepo";
import { SQLiteServiceTypeRepo } from "@/data/repositories/SQLiteServiceTypeRepo";
import i18n from "@/i18n";
import {
  computeServiceDueStatus,
  isOverdueByKm,
  isServiceOverdue,
  isUpcomingByKm,
} from "@/domain/services/serviceDue";
import { computePaymentDueOccurrences } from "@/domain/services/paymentDue";

const CHANNEL_ID = "revlog-reminders";
const NS = "revlog-local-reminder";
const MAX_HORIZON_DAYS = 120;
const FIRE_HOUR_LOCAL = 9;

let initialized = false;

interface PlannedNotification {
  key: string;
  triggerTs: number;
  title: string;
  body: string;
}

function clampPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const v = Math.floor(value);
  return v > 0 ? v : fallback;
}

function atLocalHour(ts: number, hour: number): number {
  const d = new Date(ts);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function addDays(ts: number, days: number): number {
  return ts + days * 86400000;
}

function normalizeSoon(ts: number, now: number): number {
  if (ts > now + 10_000) return ts;
  return now + 15_000;
}

function nextLocalFireTs(now: number): number {
  const todayFire = atLocalHour(now, FIRE_HOUR_LOCAL);
  if (todayFire > now + 10_000) return todayFire;
  return addDays(todayFire, 1);
}

function isSameLocalDay(aTs: number, bTs: number): boolean {
  const a = new Date(aTs);
  const b = new Date(bTs);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pushUniqueByKey(
  list: PlannedNotification[],
  candidate: PlannedNotification,
): void {
  if (list.some((i) => i.key === candidate.key)) return;
  list.push(candidate);
}

async function buildPlannedNotifications(): Promise<PlannedNotification[]> {
  const now = Date.now();
  const horizonEndTs = addDays(now, MAX_HORIZON_DAYS);
  const db = await getDatabase();

  const settingsRepo = new SQLiteNotificationSettingsRepo(db);
  const vehicleRepo = new SQLiteVehicleRepo(db);
  const costRepo = new SQLiteVehicleCostRepo(db);
  const serviceRepo = new SQLiteServiceEntryRepo(db);
  const serviceTypeRepo = new SQLiteServiceTypeRepo(db);

  const [settings, vehicles, serviceTypes] = await Promise.all([
    settingsRepo.getAll(),
    vehicleRepo.getAll(),
    serviceTypeRepo.getAll(),
  ]);

  const serviceTypeMap = new Map(serviceTypes.map((s) => [s.id, s]));
  const planned: PlannedNotification[] = [];

  if (settings.payments.enabled) {
    const leadDays = Math.max(0, Math.floor(settings.payments.offsetDays));
    const repeatDays = clampPositiveInt(settings.payments.repeatEveryDays, 1);

    for (const vehicle of vehicles) {
      const [historyEntries, paymentIntervals] = await Promise.all([
        costRepo.getHistory(vehicle.id),
        costRepo.getIntervals(vehicle.id),
      ]);

      const due = computePaymentDueOccurrences({
        intervals: paymentIntervals,
        historyEntries,
        nowTs: now,
        horizonEndTs,
      });

      for (const occurrence of due.upcoming) {
        const dueTs = occurrence.dueTs;
        const firstReminderTs = atLocalHour(
          addDays(dueTs, -leadDays),
          FIRE_HOUR_LOCAL,
        );

        for (
          let ts = firstReminderTs;
          ts <= horizonEndTs && (ts < dueTs || (leadDays === 0 && isSameLocalDay(ts, dueTs)));
          ts = addDays(ts, repeatDays)
        ) {
          if (ts < now) continue;

          const triggerTs = normalizeSoon(ts, now);
          const key = `payments:${vehicle.id}:${occurrence.intervalId}:${dueTs}:${triggerTs}`;

          pushUniqueByKey(planned, {
            key,
            triggerTs,
            title: i18n.t("notifications.paymentTitle"),
            body: i18n.t("notifications.paymentBody", {
              vehicle: vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`,
            }),
          });
        }
      }
    }
  }

  for (const vehicle of vehicles) {
    for (const interval of vehicle.serviceIntervals ?? []) {
      const st = serviceTypeMap.get(interval.serviceTypeId);
      if (!st) continue;

      const serviceName = st.translationKey
        ? i18n.t(`serviceTypes.${st.translationKey}`)
        : st.name;

      const last = await serviceRepo.getLastByTypeForVehicle(
        vehicle.id,
        interval.serviceTypeId,
      );
      const status = computeServiceDueStatus({
        interval,
        vehicle,
        lastEntry: last,
        nowTs: now,
      });

      if (settings.upcomingServices.enabled) {
        const leadDays = Math.max(
          0,
          Math.floor(settings.upcomingServices.offsetDays),
        );
        const leadKm = Math.max(
          0,
          Math.floor(settings.upcomingServices.offsetKm),
        );
        const repeatDays = clampPositiveInt(
          settings.upcomingServices.repeatEveryDays,
          1,
        );

        if (status.dueDateTs && !isServiceOverdue(status)) {
          const dueTs = status.dueDateTs;
          if (dueTs <= now) {
            // Due-date reminders are only before due date.
          } else {
            const firstReminderTs = atLocalHour(
              addDays(dueTs, -leadDays),
              FIRE_HOUR_LOCAL,
            );

            for (
              let ts = firstReminderTs;
              ts <= horizonEndTs && (ts < dueTs || (leadDays === 0 && isSameLocalDay(ts, dueTs)));
              ts = addDays(ts, repeatDays)
            ) {
              if (ts < now) continue;

              const triggerTs = normalizeSoon(ts, now);
              const key = `upcoming-days:${vehicle.id}:${interval.serviceTypeId}:${dueTs}:${triggerTs}`;

              pushUniqueByKey(planned, {
                key,
                triggerTs,
                title: i18n.t("notifications.upcomingTitle"),
                body: i18n.t("notifications.upcomingDaysBody", {
                  service: serviceName,
                  vehicle:
                    vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`,
                }),
              });
            }
          }
        }

        if (isUpcomingByKm(status, leadKm) && status.nextKm != null) {
          for (
            let ts = nextLocalFireTs(now);
            ts <= horizonEndTs;
            ts = addDays(ts, repeatDays)
          ) {
            const key = `upcoming-km:${vehicle.id}:${interval.serviceTypeId}:${status.nextKm}:${ts}`;

            pushUniqueByKey(planned, {
              key,
              triggerTs: ts,
              title: i18n.t("notifications.upcomingTitle"),
              body: i18n.t("notifications.upcomingKmBody", {
                service: serviceName,
                vehicle: vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`,
                kmLeft: status.nextKm,
              }),
            });
          }
        }
      }

      if (settings.overdueServices.enabled) {
        const graceDays = Math.max(
          0,
          Math.floor(settings.overdueServices.offsetDays),
        );
        const graceKm = Math.max(
          0,
          Math.floor(settings.overdueServices.offsetKm),
        );
        const repeatDays = clampPositiveInt(
          settings.overdueServices.repeatEveryDays,
          1,
        );

        if (status.dueDateTs) {
          const dueTs = status.dueDateTs;
          const firstOverdueTs = atLocalHour(
            addDays(dueTs, graceDays),
            FIRE_HOUR_LOCAL,
          );

          for (
            let ts = firstOverdueTs;
            ts <= horizonEndTs;
            ts = addDays(ts, repeatDays)
          ) {
            if (ts < now) continue;

            const triggerTs = normalizeSoon(ts, now);
            const key = `overdue-days:${vehicle.id}:${interval.serviceTypeId}:${dueTs}:${triggerTs}`;

            pushUniqueByKey(planned, {
              key,
              triggerTs,
              title: i18n.t("notifications.overdueTitle"),
              body: i18n.t("notifications.overdueBody", {
                service: serviceName,
                vehicle: vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`,
              }),
            });
          }
        }

        if (isOverdueByKm(status, graceKm) && status.kmOverdue != null) {
          for (
            let ts = nextLocalFireTs(now);
            ts <= horizonEndTs;
            ts = addDays(ts, repeatDays)
          ) {
            const key = `overdue-km:${vehicle.id}:${interval.serviceTypeId}:${status.kmOverdue}:${ts}`;

            pushUniqueByKey(planned, {
              key,
              triggerTs: ts,
              title: i18n.t("notifications.overdueTitle"),
              body: i18n.t("notifications.overdueBody", {
                service: serviceName,
                vehicle: vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`,
              }),
            });
          }
        }
      }
    }
  }

  return planned;
}

async function cancelManagedNotifications(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const managed = all.filter((item) => item.content.data?.ns === NS);

  await Promise.all(
    managed.map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.identifier),
    ),
  );
}

async function ensurePermissionIfNeeded(): Promise<boolean> {
  const perms = await Notifications.getPermissionsAsync();
  if (perms.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function initLocalNotifications(): Promise<void> {
  if (initialized) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Revlog reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 120, 200],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  initialized = true;
}

export async function syncNotifications(): Promise<void> {
  try {
    await initLocalNotifications();

    const db = await getDatabase();
    const settings = await new SQLiteNotificationSettingsRepo(db).getAll();
    const hasAnyEnabled =
      settings.payments.enabled ||
      settings.upcomingServices.enabled ||
      settings.overdueServices.enabled;

    if (!hasAnyEnabled) {
      await cancelManagedNotifications();
      return;
    }

    const hasPermission = await ensurePermissionIfNeeded();
    if (!hasPermission) return;

    const desired = await buildPlannedNotifications();
    const desiredByKey = new Map(desired.map((item) => [item.key, item]));

    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const managed = existing.filter((item) => item.content.data?.ns === NS);

    const seenKeys = new Set<string>();

    for (const item of managed) {
      const existingKey = String(item.content.data?.syncKey ?? "");
      const existingTs = Number(item.content.data?.triggerTs ?? -1);
      const next = desiredByKey.get(existingKey);

      if (!next) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
        continue;
      }

      if (seenKeys.has(existingKey)) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
        continue;
      }

      const contentMatches =
        item.content.title === next.title && item.content.body === next.body;
      const triggerMatches = existingTs === next.triggerTs;

      if (!contentMatches || !triggerMatches) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
        continue;
      }

      seenKeys.add(existingKey);
      desiredByKey.delete(existingKey);
    }

    for (const item of desiredByKey.values()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.body,
          sound: true,
          data: {
            ns: NS,
            syncKey: item.key,
            triggerTs: item.triggerTs,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(item.triggerTs),
          channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
        },
      });
    }
  } catch {
    // Intentionally no-op: notifications must never break the app flow.
  }
}
