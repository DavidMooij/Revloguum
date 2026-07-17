/**
 * Export / Import via AES-256-GCM + PBKDF2 (react-native-quick-crypto polyfill).
 *
 * Encryption scheme:
 *   salt   = 32 random bytes
 *   key    = PBKDF2(password, salt, iterations=100_000, keylen=32, digest=SHA-256)
 *   iv     = 12 random bytes
 *   data   = AES-256-GCM(key, iv, JSON payload)
 *   file   = JSON { version, salt, iv, data, tag } — all hex-encoded
 */
import { useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { getDatabase } from "../data/db/database";
import { formatDate, todayTs } from "../utils/date";

export type ExportResult =
  | { success: true; fileUri: string }
  | { success: false; error: string };

export type ImportResult = { success: boolean; error?: string };

interface BackupPayload {
  version: number;
  exportedAt: number;
  vehicles: any[];
  serviceTypes: any[];
  serviceEntries: any[];
  fuelEntries: any[];
  vehicleCosts: any[];
  images: Record<string, string>;
}

interface EncryptedEnvelope {
  version: 2;
  salt: string; // hex, 32 bytes
  iv: string; // hex, 12 bytes
  data: string; // hex, ciphertext + 16-byte GCM tag appended by SubtleCrypto
}

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(buf);
  return buf;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < buf.length; i++)
    buf[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return buf;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 650000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
async function encryptPayload(
  plaintext: string,
  password: string,
): Promise<EncryptedEnvelope> {
  const salt = randomBytes(32);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(
        JSON.stringify({
          app: "RevLog",
          format: "backup",
          version: 3,
        }),
      ),
    },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    version: 2,
    salt: toHex(salt),
    iv: toHex(iv),
    data: toHex(new Uint8Array(ct)),
  };
}

async function decryptPayload(
  env: EncryptedEnvelope,
  password: string,
): Promise<string> {
  const salt = fromHex(env.salt);
  const iv = fromHex(env.iv);
  const data = fromHex(env.data);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(
        JSON.stringify({
          app: "RevLog",
          format: "backup",
          version: 3,
        }),
      ),
    },
    key,
    data,
  );

  return new TextDecoder().decode(pt);
}

async function readAllData(): Promise<BackupPayload> {
  const db = await getDatabase();

  const [vehicles, serviceTypes, serviceEntries, fuelEntries, vehicleCosts] =
    await Promise.all([
      db.getAllAsync<any>("SELECT * FROM vehicles;"),
      db.getAllAsync<any>("SELECT * FROM service_types;"),
      db.getAllAsync<any>("SELECT * FROM service_entries;"),
      db.getAllAsync<any>("SELECT * FROM fuel_entries;"),
      db.getAllAsync<any>("SELECT * FROM vehicle_costs;"),
    ]);

  const images: Record<string, string> = {};

  for (const entry of serviceEntries) {
    let paths: string[] = [];
    try {
      paths = JSON.parse(entry.image_paths ?? "[]");
    } catch {}
    for (let i = 0; i < paths.length; i++) {
      try {
        images[`${entry.id}_${i}`] = await FileSystem.readAsStringAsync(
          paths[i],
          { encoding: FileSystem.EncodingType.Base64 },
        );
      } catch {}
    }
  }

  for (const v of vehicles) {
    const photoPath: string | null = v.photo_path ?? null;
    if (photoPath) {
      try {
        images[`vehicle_photo_${v.id}`] = await FileSystem.readAsStringAsync(
          photoPath,
          { encoding: FileSystem.EncodingType.Base64 },
        );
      } catch {}
    }
  }

  return {
    version: 4,
    exportedAt: Date.now(),
    vehicles,
    serviceTypes,
    serviceEntries,
    fuelEntries,
    vehicleCosts,
    images,
  };
}

async function restoreAllData(payload: BackupPayload): Promise<void> {
  const db = await getDatabase();

  const imgDir = FileSystem.documentDirectory + "revlog_images/";
  const info = await FileSystem.getInfoAsync(imgDir);
  if (!info.exists)
    await FileSystem.makeDirectoryAsync(imgDir, { intermediates: true });

  const restored: Record<string, string> = {};
  for (const [key, b64] of Object.entries(payload.images ?? {})) {
    const path = imgDir + key + ".jpg";
    await FileSystem.writeAsStringAsync(path, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    restored[key] = path;
  }

  await db.withTransactionAsync(async () => {
    for (const v of payload.vehicles ?? []) {
      const vehiclePhotoKey = `vehicle_photo_${v.id}`;
      let restoredPhotoPath: string | null =
        v.photo_path ?? v.photoPath ?? null;
      if (payload.images?.[vehiclePhotoKey]) {
        const photoPath = imgDir + vehiclePhotoKey + ".jpg";
        try {
          await FileSystem.writeAsStringAsync(
            photoPath,
            payload.images[vehiclePhotoKey],
            {
              encoding: FileSystem.EncodingType.Base64,
            },
          );
          restoredPhotoPath = photoPath;
        } catch {}
      }
      await db.runAsync(
        `INSERT OR REPLACE INTO vehicles
           (id,make,model,year,nickname,current_odometer,photo_path,
            default_tank_liters,default_fuel_price,service_intervals,
            vehicle_type,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
        [
          v.id,
          v.make,
          v.model,
          v.year ?? null,
          v.nickname ?? null,
          v.current_odometer ?? v.currentOdometer ?? 0,
          restoredPhotoPath,
          v.default_tank_liters ?? v.defaultTankLiters ?? null,
          v.default_fuel_price ?? v.defaultFuelPrice ?? null,
          v.service_intervals ??
            (v.serviceIntervals ? JSON.stringify(v.serviceIntervals) : null),
          v.vehicle_type ?? v.vehicleType ?? "motorcycle",
          v.created_at ?? v.createdAt ?? Date.now(),
          v.updated_at ?? v.updatedAt ?? Date.now(),
        ],
      );
    }

    for (const t of payload.serviceTypes ?? []) {
      if (t.is_system || t.isSystem) continue;
      await db.runAsync(
        `INSERT OR IGNORE INTO service_types (id,name,icon,is_system,sort_order,created_at)
         VALUES (?,?,?,0,?,?);`,
        [
          t.id,
          t.name,
          t.icon ?? "wrench",
          t.sort_order ?? t.sortOrder ?? 0,
          t.created_at ?? t.createdAt ?? Date.now(),
        ],
      );
    }

    for (const e of payload.serviceEntries ?? []) {
      let oldPaths: string[] = [];
      try {
        oldPaths = JSON.parse(e.image_paths ?? "[]");
      } catch {}
      const newPaths = oldPaths
        .map((_: string, i: number) => restored[`${e.id}_${i}`])
        .filter(Boolean);
      await db.runAsync(
        `INSERT OR REPLACE INTO service_entries
           (id,vehicle_id,service_type_id,date_ts,odometer_km,cost,
            notes,image_paths,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?);`,
        [
          e.id,
          e.vehicle_id ?? e.vehicleId,
          e.service_type_id ?? e.serviceTypeId,
          e.date_ts ?? e.dateTs,
          e.odometer_km ?? e.odometerKm,
          e.cost ?? null,
          e.notes ?? null,
          JSON.stringify(newPaths),
          e.created_at ?? e.createdAt ?? Date.now(),
          e.updated_at ?? e.updatedAt ?? Date.now(),
        ],
      );
    }

    for (const f of payload.fuelEntries ?? []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO fuel_entries
           (id,vehicle_id,date_ts,odometer_km,liters,cost,notes,created_at)
         VALUES (?,?,?,?,?,?,?,?);`,
        [
          f.id,
          f.vehicle_id ?? f.vehicleId,
          f.date_ts ?? f.dateTs,
          f.odometer_km ?? f.odometerKm,
          f.liters,
          f.cost ?? null,
          f.notes ?? null,
          f.created_at ?? f.createdAt ?? Date.now(),
        ],
      );
    }

    for (const c of payload.vehicleCosts ?? []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO vehicle_costs
           (id,vehicle_id,category,amount,date_ts,interval_type,notes,created_at)
         VALUES (?,?,?,?,?,?,?,?);`,
        [
          c.id,
          c.vehicle_id ?? c.vehicleId,
          c.category,
          c.amount,
          c.date_ts ?? c.dateTs,
          c.interval_type ?? c.intervalType ?? null,
          c.notes ?? null,
          c.created_at ?? c.createdAt ?? Date.now(),
        ],
      );
    }
  });
}

export function useExport() {
  /**
   * Export: reads all data → PBKDF2+AES-256-GCM encrypt with user password →
   * writes .rvlg file → returns fileUri (does NOT share yet).
   */
  const exportDatabase = useCallback(
    async (password: string): Promise<ExportResult> => {
      try {
        const payload = await readAllData();
        const envelope = await encryptPayload(
          JSON.stringify(payload),
          password,
        );
        const fileContent = JSON.stringify(envelope);

        const filename = `revlog_backup_${formatDate(todayTs())}.rvlg`;
        const fileUri = FileSystem.cacheDirectory + filename;

        await FileSystem.writeAsStringAsync(fileUri, fileContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        return { success: true, fileUri };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    },
    [],
  );

  /** Step 2: share the prepared file via expo-sharing (works correctly on Android). */
  const shareExportFile = useCallback(
    async (fileUri: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const available = await Sharing.isAvailableAsync();
        if (!available) {
          return {
            success: false,
            error: "Sharing is not available on this device",
          };
        }
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/octet-stream",
          dialogTitle: "Save RevLog backup",
          UTI: "public.data",
        });
        return { success: true };
      } catch (e: any) {
        if (e?.message?.toLowerCase().includes("cancel"))
          return { success: true };
        return { success: false, error: (e as Error).message };
      }
    },
    [],
  );

  /**
   * Import: pick .rvlg → PBKDF2+AES-256-GCM decrypt → INSERT OR REPLACE.
   * DB stays open the whole time — no file system manipulation.
   */
  const importDatabase = useCallback(
    async (password: string): Promise<ImportResult> => {
      if (!password.trim()) {
        return { success: false, error: "Password is required" };
      }

      let picked: Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>;
      try {
        picked = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
        });
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
      if (picked.canceled) return { success: false, error: "Cancelled" };

      try {
        const fileContent = await FileSystem.readAsStringAsync(
          picked.assets[0].uri,
          { encoding: FileSystem.EncodingType.UTF8 },
        );

        const envelope: EncryptedEnvelope = JSON.parse(fileContent);
        if (
          envelope.version !== 2 ||
          !envelope.iv ||
          !envelope.data ||
          !envelope.salt
        ) {
          return { success: false, error: "Not a valid RevLog backup file" };
        }

        let json: string;
        try {
          json = await decryptPayload(envelope, password);
        } catch {
          return {
            success: false,
            error: "Wrong password or corrupted backup",
          };
        }

        const payload: BackupPayload = JSON.parse(json);
        if (!Array.isArray(payload.vehicles)) {
          return { success: false, error: "Backup file is corrupted" };
        }

        await restoreAllData(payload);
        return { success: true };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    },
    [],
  );

  /** Wipe all user data without touching the DB file or encryption key. */
  const clearAllData = useCallback(async (): Promise<ImportResult> => {
    try {
      const db = await getDatabase();
      await db.withTransactionAsync(async () => {
        await db.runAsync("DELETE FROM service_entries;");
        await db.runAsync("DELETE FROM fuel_entries;");
        await db.runAsync("DELETE FROM vehicle_costs;");
        await db.runAsync("DELETE FROM vehicles;");
        await db.runAsync("DELETE FROM service_types WHERE is_system = 0;");
      });
      const imgDir = FileSystem.documentDirectory + "revlog_images/";
      const info = await FileSystem.getInfoAsync(imgDir);
      if (info.exists)
        await FileSystem.deleteAsync(imgDir, { idempotent: true });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }, []);

  return { exportDatabase, shareExportFile, importDatabase, clearAllData };
}
