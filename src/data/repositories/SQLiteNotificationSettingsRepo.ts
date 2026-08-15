import type * as SQLite from "expo-sqlite";
import {
  defaultNotificationSettings,
  type NotificationSetting,
  type NotificationSettingKind,
  type NotificationSettingsBundle,
} from "../../domain/entities/NotificationSettings";

interface NotificationSettingRow {
  kind: NotificationSettingKind;
  enabled: number;
  offset_days: number;
  offset_km: number;
  repeat_every_days: number;
  updated_at: number;
}

let schemaChecked = false;

function rowToSetting(row: NotificationSettingRow): NotificationSetting {
  return {
    kind: row.kind,
    enabled: row.enabled === 1,
    offsetDays: row.offset_days,
    offsetKm: row.offset_km ?? 0,
    repeatEveryDays: row.repeat_every_days,
    updatedAt: row.updated_at,
  };
}

export class SQLiteNotificationSettingsRepo {
  constructor(private db: SQLite.SQLiteDatabase) {}

  private async ensureSchema(): Promise<void> {
    if (schemaChecked) return;

    const cols = await this.db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(notification_settings);",
    );
    const hasOffsetKm = cols.some((c) => c.name === "offset_km");

    if (!hasOffsetKm) {
      await this.db.execAsync(
        "ALTER TABLE notification_settings ADD COLUMN offset_km INTEGER NOT NULL DEFAULT 0;",
      );

      await this.db.runAsync(
        "UPDATE notification_settings SET offset_km = 500 WHERE kind = 'upcoming_services';",
      );
      await this.db.runAsync(
        "UPDATE notification_settings SET offset_km = 100 WHERE kind = 'overdue_services';",
      );
    }

    schemaChecked = true;
  }

  async getAll(): Promise<NotificationSettingsBundle> {
    await this.ensureSchema();

    const defaults = defaultNotificationSettings();
    const rows = await this.db.getAllAsync<NotificationSettingRow>(
      "SELECT * FROM notification_settings;",
    );

    const mapped = new Map(rows.map((row) => [row.kind, rowToSetting(row)]));

    return {
      payments: mapped.get("payments") ?? defaults.payments,
      upcomingServices:
        mapped.get("upcoming_services") ?? defaults.upcomingServices,
      overdueServices:
        mapped.get("overdue_services") ?? defaults.overdueServices,
    };
  }

  async upsert(
    kind: NotificationSettingKind,
    patch: Pick<
      NotificationSetting,
      "enabled" | "offsetDays" | "offsetKm" | "repeatEveryDays"
    >,
  ): Promise<void> {
    await this.ensureSchema();

    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO notification_settings
         (kind, enabled, offset_days, offset_km, repeat_every_days, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(kind) DO UPDATE SET
         enabled = excluded.enabled,
         offset_days = excluded.offset_days,
         offset_km = excluded.offset_km,
         repeat_every_days = excluded.repeat_every_days,
         updated_at = excluded.updated_at;`,
      [
        kind,
        patch.enabled ? 1 : 0,
        Math.max(0, Math.floor(patch.offsetDays)),
        Math.max(0, Math.floor(patch.offsetKm)),
        Math.max(1, Math.floor(patch.repeatEveryDays)),
        now,
      ],
    );
  }
}
