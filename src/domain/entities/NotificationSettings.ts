export type NotificationSettingKind =
  | "payments"
  | "upcoming_services"
  | "overdue_services";

export interface NotificationSetting {
  kind: NotificationSettingKind;
  enabled: boolean;
  offsetDays: number;
  offsetKm: number;
  repeatEveryDays: number;
  updatedAt: number;
}

export interface NotificationSettingsBundle {
  payments: NotificationSetting;
  upcomingServices: NotificationSetting;
  overdueServices: NotificationSetting;
}

export function defaultNotificationSettings(): NotificationSettingsBundle {
  const now = Date.now();

  return {
    payments: {
      kind: "payments",
      enabled: false,
      offsetDays: 7,
      offsetKm: 0,
      repeatEveryDays: 1,
      updatedAt: now,
    },
    upcomingServices: {
      kind: "upcoming_services",
      enabled: false,
      offsetDays: 7,
      offsetKm: 500,
      repeatEveryDays: 1,
      updatedAt: now,
    },
    overdueServices: {
      kind: "overdue_services",
      enabled: false,
      offsetDays: 3,
      offsetKm: 100,
      repeatEveryDays: 1,
      updatedAt: now,
    },
  };
}
