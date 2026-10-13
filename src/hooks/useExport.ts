/**
 * Export / Import via AES-256-GCM + PBKDF2.
 *
 * Encryption scheme:
 *   salt = 32 random bytes
 *   key  = PBKDF2(password, salt, 650_000 iterations, 32 bytes, SHA-256)
 *   iv   = 12 random bytes
 *   data = AES-256-GCM(key, iv, JSON payload)
 *   file = JSON { version, salt, iv, data }
 *
 * PBKDF2-HMAC-SHA256: 650,000 iterations
 * (OWASP recommendation: 600,000+)
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { getDatabase } from '../data/db/database';
import { migrateLegacyPurchaseCostsInTransaction } from '../data/db/migrations/v15_vehicle_purchase_price';
import { formatDate, todayTs } from '../utils/date';
import { decryptImage, deleteEncryptedImage, encryptImage } from '@/security/imageEncryption';

export type ExportResult = { success: true; fileUri: string } | { success: false; error: string };

export interface ImportIssue {
  kind: 'image' | 'note';
  source?: 'vehicle' | 'service' | 'cost' | 'document';
  location: string;
}

export interface ImportSummary {
  counts: {
    vehicles: number;
    serviceEntries: number;
    fuelEntries: number;
    costs: number;
    documents: number;
    serviceTypes: number;
    paymentTypes: number;
    images: number;
  };
  issues: ImportIssue[];
}

export type ImportResult = { success: true; summary: ImportSummary } | { success: false; error?: string; cancelled?: true };

type ClearAllDataResult = { success: true } | { success: false; error: string };

interface BackupPayload {
  version: number;
  exportedAt: number;
  vehicles: any[];
  serviceTypes?: any[];
  paymentTypes?: any[];
  serviceEntries: any[];
  fuelEntries: any[];
  vehicleCosts: any[];
  documents?: any[];
  documentPages?: any[];
  images?: Record<string, unknown>;
}

interface EncryptedEnvelope {
  version: 2;
  salt: string; // hex, 32 bytes
  iv: string; // hex, 12 bytes
  data: string; // hex, ciphertext + 16-byte GCM tag appended by SubtleCrypto
}

type ImportImageReference = {
  key: string;
  source: NonNullable<ImportIssue['source']>;
  location: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStringField(value: unknown, ...keys: string[]): boolean {
  return isRecord(value) && keys.some((key) => typeof value[key] === 'string' && value[key].trim().length > 0);
}

function hasNumberField(value: unknown, ...keys: string[]): boolean {
  return isRecord(value) && keys.some((key) => typeof value[key] === 'number' && Number.isFinite(value[key]));
}

function isBackupPayload(value: unknown): value is BackupPayload {
  if (!isRecord(value)) return false;
  if (
    !Array.isArray(value.vehicles) ||
    !Array.isArray(value.serviceEntries) ||
    !Array.isArray(value.fuelEntries) ||
    !Array.isArray(value.vehicleCosts)
  ) {
    return false;
  }

  const optionalArrays = ['serviceTypes', 'paymentTypes', 'documents', 'documentPages'];
  if (optionalArrays.some((key) => value[key] != null && !Array.isArray(value[key]))) return false;
  if (
    !value.vehicles.every((vehicle) => hasStringField(vehicle, 'id') && hasStringField(vehicle, 'make') && hasStringField(vehicle, 'model'))
  ) {
    return false;
  }
  if (
    !value.serviceEntries.every(
      (entry) =>
        hasStringField(entry, 'id') &&
        hasStringField(entry, 'vehicle_id', 'vehicleId') &&
        hasStringField(entry, 'service_type_id', 'serviceTypeId') &&
        hasNumberField(entry, 'date_ts', 'dateTs') &&
        hasNumberField(entry, 'odometer_km', 'odometerKm')
    )
  ) {
    return false;
  }
  if (
    !value.fuelEntries.every(
      (entry) =>
        hasStringField(entry, 'id') &&
        hasStringField(entry, 'vehicle_id', 'vehicleId') &&
        hasNumberField(entry, 'date_ts', 'dateTs') &&
        hasNumberField(entry, 'odometer_km', 'odometerKm') &&
        hasNumberField(entry, 'liters')
    )
  ) {
    return false;
  }
  if (
    !value.vehicleCosts.every(
      (cost) =>
        hasStringField(cost, 'id') &&
        hasStringField(cost, 'vehicle_id', 'vehicleId') &&
        hasStringField(cost, 'category') &&
        hasNumberField(cost, 'amount') &&
        hasNumberField(cost, 'date_ts', 'dateTs')
    )
  ) {
    return false;
  }
  if (
    Array.isArray(value.serviceTypes) &&
    !value.serviceTypes.every((serviceType) => hasStringField(serviceType, 'id') && hasStringField(serviceType, 'name'))
  ) {
    return false;
  }
  if (
    Array.isArray(value.paymentTypes) &&
    !value.paymentTypes.every((paymentType) => hasStringField(paymentType, 'id') && hasStringField(paymentType, 'name'))
  ) {
    return false;
  }
  if (
    Array.isArray(value.documents) &&
    !value.documents.every(
      (document) =>
        hasStringField(document, 'id') &&
        hasStringField(document, 'vehicle_id', 'vehicleId') &&
        hasStringField(document, 'owner_type', 'ownerType') &&
        hasStringField(document, 'owner_id', 'ownerId') &&
        hasStringField(document, 'title')
    )
  ) {
    return false;
  }
  if (
    Array.isArray(value.documentPages) &&
    !value.documentPages.every((page) => hasStringField(page, 'id') && hasStringField(page, 'document_id', 'documentId'))
  ) {
    return false;
  }
  return value.images == null || isRecord(value.images);
}

function parseImagePaths(value: unknown): string[] {
  let paths = value;
  if (typeof paths === 'string') {
    try {
      paths = JSON.parse(paths);
    } catch {
      return [];
    }
  }
  return Array.isArray(paths) ? paths.filter((path): path is string => typeof path === 'string') : [];
}

function cleanLocation(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return value.replace(/\s+/g, ' ').trim().slice(0, 64);
}

function recordLocation(label: unknown, fallback: string, record: any): string {
  const base = cleanLocation(label, fallback);
  const dateTs = record.date_ts ?? record.dateTs;
  return typeof dateTs === 'number' && Number.isFinite(dateTs) ? `${base} · ${formatDate(dateTs)}` : base;
}

function validateImageFile(uri: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, () => resolve(), reject);
  });
}

function normalizeNote(value: unknown, location: string, issues: ImportIssue[]): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  issues.push({ kind: 'note', location });
  return null;
}

async function prepareImportImages(
  references: ImportImageReference[],
  images: Record<string, unknown> | null | undefined
): Promise<{ restored: Record<string, string>; encryptedPaths: string[] }> {
  const restored: Record<string, string> = {};
  const encryptedPaths: string[] = [];
  let tempIndex = 0;

  try {
    for (const reference of references) {
      const imageBase64 = images?.[reference.key];
      if (typeof imageBase64 !== 'string') continue;

      const tempPath = `${FileSystem.cacheDirectory}revloguum-import-${tempIndex++}.jpg`;
      try {
        await FileSystem.writeAsStringAsync(tempPath, imageBase64, {
          encoding: FileSystem.EncodingType.Base64
        });
        try {
          await validateImageFile(tempPath);
        } catch {
          continue;
        }

        const encryptedPath = await encryptImage(tempPath);
        restored[reference.key] = encryptedPath;
        encryptedPaths.push(encryptedPath);
      } finally {
        await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
      }
    }
  } catch (error) {
    await Promise.all(encryptedPaths.map((path) => deleteEncryptedImage(path).catch(() => {})));
    throw error;
  }

  return { restored, encryptedPaths };
}

const BACKUP_AUTH_CONTEXT = {
  app: 'Revloguum',
  format: 'backup',
  version: 3
};

const LEGACY_BACKUP_AUTH_CONTEXT = {
  ...BACKUP_AUTH_CONTEXT,
  app: 'Revloguumuum'
};

function encodeAuthContext(context: typeof BACKUP_AUTH_CONTEXT): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(JSON.stringify(context));
  const result = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  result.set(encoded);
  return result;
}

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(buf);
  return buf;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < buf.length; i++) buf[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return buf;
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 650000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
async function encryptPayload(plaintext: string, password: string): Promise<EncryptedEnvelope> {
  const salt = randomBytes(32);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: encodeAuthContext(BACKUP_AUTH_CONTEXT)
    },
    key,
    new TextEncoder().encode(plaintext)
  );
  return {
    version: 2,
    salt: toHex(salt),
    iv: toHex(iv),
    data: toHex(new Uint8Array(ct))
  };
}

async function decryptPayload(env: EncryptedEnvelope, password: string): Promise<string> {
  const salt = fromHex(env.salt);
  const iv = fromHex(env.iv);
  const data = fromHex(env.data);
  const key = await deriveKey(password, salt);
  let pt: ArrayBuffer;
  try {
    pt = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: encodeAuthContext(BACKUP_AUTH_CONTEXT)
      },
      key,
      data
    );
  } catch {
    pt = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: encodeAuthContext(LEGACY_BACKUP_AUTH_CONTEXT)
      },
      key,
      data
    );
  }

  return new TextDecoder().decode(pt);
}

async function readAllData(): Promise<BackupPayload> {
  const db = await getDatabase();

  const [vehicles, serviceTypes, paymentTypes, serviceEntries, fuelEntries, vehicleCosts, documents, documentPages] = await Promise.all([
    db.getAllAsync<any>('SELECT * FROM vehicles;'),
    db.getAllAsync<any>('SELECT * FROM service_types;'),
    db.getAllAsync<any>('SELECT * FROM payment_types;'),
    db.getAllAsync<any>('SELECT * FROM service_entries;'),
    db.getAllAsync<any>('SELECT * FROM fuel_entries;'),
    db.getAllAsync<any>('SELECT * FROM vehicle_costs;'),
    db.getAllAsync<any>('SELECT * FROM documents;'),
    db.getAllAsync<any>('SELECT * FROM document_pages;')
  ]);

  const images: Record<string, string> = {};

  for (const entry of serviceEntries) {
    let paths: string[] = [];
    try {
      paths = JSON.parse(entry.image_paths ?? '[]');
    } catch {}
    for (let i = 0; i < paths.length; i++) {
      const decryptedUri = await decryptImage(paths[i]);

      images[`${entry.id}_${i}`] = await FileSystem.readAsStringAsync(decryptedUri, {
        encoding: FileSystem.EncodingType.Base64
      });
    }
  }

  for (const cost of vehicleCosts) {
    let paths: string[] = [];
    try {
      paths = JSON.parse(cost.image_paths ?? '[]');
    } catch {}
    for (let i = 0; i < paths.length; i++) {
      const decryptedUri = paths[i].endsWith('.enc') ? await decryptImage(paths[i]) : paths[i];
      images[`cost_${cost.id}_${i}`] = await FileSystem.readAsStringAsync(decryptedUri, {
        encoding: FileSystem.EncodingType.Base64
      });
    }
  }

  for (const v of vehicles) {
    const photoPath: string | null = v.photo_path ?? null;
    if (photoPath) {
      const decryptedUri = photoPath.endsWith('.enc') ? await decryptImage(photoPath) : photoPath;
      images[`vehicle_photo_${v.id}`] = await FileSystem.readAsStringAsync(decryptedUri, { encoding: FileSystem.EncodingType.Base64 });
    }
  }

  for (const page of documentPages) {
    const decryptedUri = page.path.endsWith('.enc') ? await decryptImage(page.path) : page.path;
    images[`document_page_${page.id}`] = await FileSystem.readAsStringAsync(decryptedUri, {
      encoding: FileSystem.EncodingType.Base64
    });
  }

  return {
    version: 6,
    exportedAt: Date.now(),
    vehicles,
    serviceTypes,
    paymentTypes,
    serviceEntries,
    fuelEntries,
    vehicleCosts,
    documents,
    documentPages,
    images
  };
}

async function restoreAllData(payload: BackupPayload): Promise<ImportSummary> {
  const db = await getDatabase();

  const costIds = new Set((payload.vehicleCosts ?? []).map((cost) => cost.id));
  const purchaseCostIds = new Set((payload.vehicleCosts ?? []).filter((cost) => cost.category === 'purchase').map((cost) => cost.id));
  const legacyCostDocuments = (payload.documents ?? [])
    .filter((document) => {
      const ownerType = document.owner_type ?? document.ownerType;
      const ownerId = document.owner_id ?? document.ownerId;
      return ownerType === 'cost' && costIds.has(ownerId) && !purchaseCostIds.has(ownerId);
    })
    .sort((first, second) => {
      const firstDate = first.date_ts ?? first.dateTs ?? 0;
      const secondDate = second.date_ts ?? second.dateTs ?? 0;
      if (secondDate !== firstDate) return secondDate - firstDate;
      const firstCreated = first.created_at ?? first.createdAt ?? 0;
      const secondCreated = second.created_at ?? second.createdAt ?? 0;
      return secondCreated - firstCreated || String(first.id).localeCompare(String(second.id));
    });
  const legacyCostDocumentIds = new Set(legacyCostDocuments.map((document) => document.id));
  const legacyCostDocumentOrder = new Map(legacyCostDocuments.map((document, index) => [document.id, index] as const));
  const legacyCostDocumentOwners = new Map(
    legacyCostDocuments.map((document) => [document.id, document.owner_id ?? document.ownerId] as const)
  );
  const legacyCostPagesByCost = new Map<string, string[]>();
  const legacyCostPages = (payload.documentPages ?? [])
    .filter((page) => legacyCostDocumentIds.has(page.document_id ?? page.documentId))
    .sort((first, second) => {
      const firstDocumentOrder = legacyCostDocumentOrder.get(first.document_id ?? first.documentId) ?? 0;
      const secondDocumentOrder = legacyCostDocumentOrder.get(second.document_id ?? second.documentId) ?? 0;
      return (
        firstDocumentOrder - secondDocumentOrder ||
        (first.sort_order ?? first.sortOrder ?? 0) - (second.sort_order ?? second.sortOrder ?? 0)
      );
    });
  for (const page of legacyCostPages) {
    const ownerId = legacyCostDocumentOwners.get(page.document_id ?? page.documentId);
    if (!ownerId) continue;
    const pageIds = legacyCostPagesByCost.get(ownerId) ?? [];
    pageIds.push(page.id);
    legacyCostPagesByCost.set(ownerId, pageIds);
  }

  const restoredDocumentIds = (payload.documents ?? [])
    .filter((document) => !legacyCostDocumentIds.has(document.id))
    .map((document) => document.id);
  const replacedDocumentPages =
    restoredDocumentIds.length > 0
      ? await db.getAllAsync<{ path: string }>(
          `SELECT path FROM document_pages
           WHERE document_id IN (${restoredDocumentIds.map(() => '?').join(',')});`,
          restoredDocumentIds
        )
      : [];
  const restoredCostIds = (payload.vehicleCosts ?? []).map((cost) => cost.id).filter(Boolean);
  const replacedCostImageRows =
    restoredCostIds.length > 0
      ? await db.getAllAsync<{ image_paths: string | null }>(
          `SELECT image_paths FROM vehicle_costs WHERE id IN (${restoredCostIds.map(() => '?').join(',')});`,
          restoredCostIds
        )
      : [];
  const replacedCostImages = replacedCostImageRows.flatMap((row) => {
    try {
      const paths: unknown = JSON.parse(row.image_paths ?? '[]');
      return Array.isArray(paths) ? paths.filter((path): path is string => typeof path === 'string') : [];
    } catch {
      return [];
    }
  });

  const serviceTypeNames = new Map((payload.serviceTypes ?? []).map((serviceType) => [serviceType.id, serviceType.name]));
  const documentTitles = new Map((payload.documents ?? []).map((document) => [document.id, document.title]));
  const imageReferences: ImportImageReference[] = [];

  for (const vehicle of payload.vehicles) {
    const photoPath = vehicle.photo_path ?? vehicle.photoPath;
    if (!photoPath) continue;
    const vehicleName = vehicle.nickname || [vehicle.make, vehicle.model].filter(Boolean).join(' ');
    imageReferences.push({
      key: `vehicle_photo_${vehicle.id}`,
      source: 'vehicle',
      location: cleanLocation(vehicleName, String(vehicle.id ?? 'vehicle'))
    });
  }

  for (const entry of payload.serviceEntries) {
    const serviceTypeId = entry.service_type_id ?? entry.serviceTypeId;
    const serviceName = serviceTypeNames.get(serviceTypeId) ?? serviceTypeId;
    const label = recordLocation(serviceName, String(entry.id ?? 'service'), entry);
    parseImagePaths(entry.image_paths ?? entry.imagePaths).forEach((_, index) => {
      imageReferences.push({ key: `${entry.id}_${index}`, source: 'service', location: `${label} #${index + 1}` });
    });
  }

  for (const cost of payload.vehicleCosts) {
    const label = recordLocation(cost.category, String(cost.id ?? 'cost'), cost);
    parseImagePaths(cost.image_paths ?? cost.imagePaths).forEach((_, index) => {
      imageReferences.push({ key: `cost_${cost.id}_${index}`, source: 'cost', location: `${label} #${index + 1}` });
    });
  }

  for (const page of payload.documentPages ?? []) {
    const documentId = page.document_id ?? page.documentId;
    const documentTitle = documentTitles.get(documentId);
    const pageIndex =
      typeof page.sort_order === 'number' ? page.sort_order + 1 : typeof page.sortOrder === 'number' ? page.sortOrder + 1 : 1;
    imageReferences.push({
      key: `document_page_${page.id}`,
      source: 'document',
      location: `${cleanLocation(documentTitle, String(documentId ?? 'document'))} #${pageIndex}`
    });
  }

  const { restored, encryptedPaths } = await prepareImportImages(imageReferences, payload.images);
  const issues: ImportIssue[] = imageReferences.flatMap((reference) =>
    restored[reference.key] ? [] : [{ kind: 'image' as const, source: reference.source, location: reference.location }]
  );

  const importedDocumentIds = (payload.documents ?? []).filter((document) => !legacyCostDocumentIds.has(document.id)).length;

  const restoreTransaction = () =>
    db.withTransactionAsync(async () => {
      for (const v of payload.vehicles ?? []) {
        const vehiclePhotoKey = `vehicle_photo_${v.id}`;
        const restoredPhotoPath = restored[vehiclePhotoKey] ?? null;
        await db.runAsync(
          `INSERT OR REPLACE INTO vehicles
          (id,make,model,year,nickname,current_odometer,base_odometer,purchase_price,residual_value,photo_path,
          default_tank_liters,default_fuel_price,service_intervals,
            vehicle_type,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
          [
            v.id,
            v.make,
            v.model,
            v.year ?? null,
            v.nickname ?? null,
            v.current_odometer ?? v.currentOdometer ?? 0,
            v.base_odometer ?? v.baseOdometer ?? v.current_odometer ?? v.currentOdometer ?? 0,
            v.purchase_price ?? v.purchasePrice ?? null,
            v.residual_value ?? v.residualValue ?? null,
            restoredPhotoPath,
            v.default_tank_liters ?? v.defaultTankLiters ?? null,
            v.default_fuel_price ?? v.defaultFuelPrice ?? null,
            v.service_intervals ?? (v.serviceIntervals ? JSON.stringify(v.serviceIntervals) : null),
            v.vehicle_type ?? v.vehicleType ?? 'motorcycle',
            v.created_at ?? v.createdAt ?? Date.now(),
            v.updated_at ?? v.updatedAt ?? Date.now()
          ]
        );
      }

      for (const t of payload.serviceTypes ?? []) {
        if (t.is_system || t.isSystem) continue;
        await db.runAsync(
          `INSERT OR IGNORE INTO service_types (id,name,icon,is_system,sort_order,created_at)
         VALUES (?,?,?,0,?,?);`,
          [t.id, t.name, t.icon ?? 'wrench', t.sort_order ?? t.sortOrder ?? 0, t.created_at ?? t.createdAt ?? Date.now()]
        );
      }

      for (const t of payload.paymentTypes ?? []) {
        if (t.id === 'purchase' || t.is_system || t.isSystem) continue;
        await db.runAsync(
          `INSERT OR IGNORE INTO payment_types (id,name,translation_key,icon,is_system,sort_order,created_at)
         VALUES (?,?,NULL,?,0,?,?);`,
          [t.id, t.name, t.icon ?? 'receipt', t.sort_order ?? t.sortOrder ?? 0, t.created_at ?? t.createdAt ?? Date.now()]
        );
      }

      for (const e of payload.serviceEntries ?? []) {
        let oldPaths: string[] = [];
        try {
          oldPaths = JSON.parse(e.image_paths ?? '[]');
        } catch {}
        const newPaths = oldPaths.map((_: string, i: number) => restored[`${e.id}_${i}`]).filter(Boolean);
        await db.runAsync(
          `INSERT OR REPLACE INTO service_entries
           (id,vehicle_id,service_type_id,date_ts,odometer_km,cost,
            notes,image_paths,group_id,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?);`,
          [
            e.id,
            e.vehicle_id ?? e.vehicleId,
            e.service_type_id ?? e.serviceTypeId,
            e.date_ts ?? e.dateTs,
            e.odometer_km ?? e.odometerKm,
            e.cost ?? null,
            normalizeNote(e.notes, recordLocation(serviceTypeNames.get(e.service_type_id ?? e.serviceTypeId), String(e.id), e), issues),
            JSON.stringify(newPaths),
            e.group_id ?? e.groupId ?? null,
            e.created_at ?? e.createdAt ?? Date.now(),
            e.updated_at ?? e.updatedAt ?? Date.now()
          ]
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
            normalizeNote(f.notes, recordLocation('Fuel entry', String(f.id), f), issues),
            f.created_at ?? f.createdAt ?? Date.now()
          ]
        );
      }

      for (const c of payload.vehicleCosts ?? []) {
        const restoredIntervalType = c.interval_type ?? c.intervalType ?? null;
        const restoredKind =
          c.kind ??
          (restoredIntervalType === 'monthly' || restoredIntervalType === 'yearly' || restoredIntervalType === 'custom'
            ? 'interval'
            : 'history');

        const restoredIntervalDays =
          c.interval_days ?? c.intervalDays ?? (restoredIntervalType === 'monthly' ? 30 : restoredIntervalType === 'yearly' ? 365 : null);
        let oldImagePaths: string[] = [];
        try {
          oldImagePaths = JSON.parse(c.image_paths ?? c.imagePaths ?? '[]');
        } catch {}
        const imagePaths = oldImagePaths.map((_: string, index: number) => restored[`cost_${c.id}_${index}`]).filter(Boolean);
        imagePaths.push(...(legacyCostPagesByCost.get(c.id) ?? []).map((pageId) => restored[`document_page_${pageId}`]).filter(Boolean));

        await db.runAsync(
          `INSERT OR REPLACE INTO vehicle_costs
           (id,vehicle_id,kind,category,amount,date_ts,interval_type,interval_days,payment_interval_id,interval_due_ts,notes,image_paths,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
          [
            c.id,
            c.vehicle_id ?? c.vehicleId,
            restoredKind,
            c.category,
            c.amount,
            c.date_ts ?? c.dateTs,
            restoredKind === 'interval' ? restoredIntervalType : null,
            restoredKind === 'interval' ? restoredIntervalDays : null,
            c.payment_interval_id ?? c.paymentIntervalId ?? null,
            c.interval_due_ts ?? c.intervalDueTs ?? null,
            normalizeNote(c.notes, recordLocation(c.category, String(c.id), c), issues),
            JSON.stringify(imagePaths),
            c.created_at ?? c.createdAt ?? Date.now()
          ]
        );
      }

      for (const document of payload.documents ?? []) {
        const documentNotes = normalizeNote(document.notes, cleanLocation(document.title, String(document.id)), issues);
        if (legacyCostDocumentIds.has(document.id)) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO documents
          (id,vehicle_id,owner_type,owner_id,title,category,date_ts,notes,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?);`,
          [
            document.id,
            document.vehicle_id ?? document.vehicleId,
            document.owner_type ?? document.ownerType,
            document.owner_id ?? document.ownerId,
            document.title,
            document.category ?? null,
            document.date_ts ?? document.dateTs ?? Date.now(),
            documentNotes,
            document.created_at ?? document.createdAt ?? Date.now(),
            document.updated_at ?? document.updatedAt ?? Date.now()
          ]
        );
      }

      for (const page of payload.documentPages ?? []) {
        if (legacyCostDocumentIds.has(page.document_id ?? page.documentId)) continue;
        const pagePath = restored[`document_page_${page.id}`];
        if (!pagePath) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO document_pages
          (id,document_id,path,sort_order)
         VALUES (?,?,?,?);`,
          [page.id, page.document_id ?? page.documentId, pagePath, page.sort_order ?? page.sortOrder ?? 0]
        );
      }

      await migrateLegacyPurchaseCostsInTransaction(db);
    });

  try {
    await restoreTransaction();
  } catch (error) {
    await Promise.all(encryptedPaths.map((path) => deleteEncryptedImage(path).catch(() => {})));
    throw error;
  }

  const replacedImagePaths = new Set([...replacedDocumentPages.map((page) => page.path), ...replacedCostImages]);
  await Promise.all([...replacedImagePaths].map((path) => deleteEncryptedImage(path).catch(() => {})));

  return {
    counts: {
      vehicles: payload.vehicles.length,
      serviceEntries: payload.serviceEntries.length,
      fuelEntries: payload.fuelEntries.length,
      costs: payload.vehicleCosts.length,
      documents: importedDocumentIds,
      serviceTypes: (payload.serviceTypes ?? []).filter((serviceType) => !serviceType.is_system && !serviceType.isSystem).length,
      paymentTypes: (payload.paymentTypes ?? []).filter(
        (paymentType) => paymentType.id !== 'purchase' && !paymentType.is_system && !paymentType.isSystem
      ).length,
      images: Math.max(0, imageReferences.length - issues.filter((issue) => issue.kind === 'image').length)
    },
    issues
  };
}

export function useExport() {
  const { t } = useTranslation();

  /**
   * Export: reads all data → PBKDF2+AES-256-GCM encrypt with user password →
   * writes .rvlg file → returns fileUri (does NOT share yet).
   */
  const exportDatabase = useCallback(
    async (password: string): Promise<ExportResult> => {
      try {
        const payload = await readAllData();
        const envelope = await encryptPayload(JSON.stringify(payload), password);
        const fileContent = JSON.stringify(envelope);

        const filename = `Revloguum_backup_${formatDate(todayTs())}.rvlg`;
        const fileUri = FileSystem.cacheDirectory + filename;

        await FileSystem.writeAsStringAsync(fileUri, fileContent, {
          encoding: FileSystem.EncodingType.UTF8
        });

        return { success: true, fileUri };
      } catch {
        return { success: false, error: t('settings.exportFailed') };
      }
    },
    [t]
  );

  /** Step 2: share the prepared file via expo-sharing (works correctly on Android). */
  const shareExportFile = useCallback(
    async (fileUri: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const available = await Sharing.isAvailableAsync();
        if (!available) {
          return {
            success: false,
            error: t('settings.sharingUnavailable')
          };
        }
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Save Revloguum backup',
          UTI: 'public.data'
        });
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.toLowerCase().includes('cancel')) return { success: true };
        return { success: false, error: t('settings.sharingFailed') };
      }
    },
    [t]
  );

  /**
   * Import: pick .rvlg → PBKDF2+AES-256-GCM decrypt → INSERT OR REPLACE.
   * DB stays open the whole time - no file system manipulation.
   */
  const importDatabase = useCallback(
    async (password: string): Promise<ImportResult> => {
      if (!password.trim()) {
        return { success: false, error: t('settings.passwordRequired') };
      }

      let picked: Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>;
      try {
        picked = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true
        });
      } catch {
        return { success: false, error: t('settings.importFailed') };
      }
      if (picked.canceled) return { success: false, cancelled: true };

      try {
        const fileContent = await FileSystem.readAsStringAsync(picked.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });

        const envelope: EncryptedEnvelope = JSON.parse(fileContent);
        if (envelope.version !== 2 || !envelope.iv || !envelope.data || !envelope.salt) {
          return { success: false, error: t('settings.invalidBackupFile') };
        }

        let json: string;
        try {
          json = await decryptPayload(envelope, password);
        } catch {
          return {
            success: false,
            error: t('settings.wrongPasswordOrCorruptBackup')
          };
        }

        const decodedPayload: unknown = JSON.parse(json);
        if (!isBackupPayload(decodedPayload)) {
          return { success: false, error: t('settings.corruptedBackup') };
        }

        const payload = decodedPayload;
        const summary = await restoreAllData(payload);
        return { success: true, summary };
      } catch {
        return { success: false, error: t('settings.importFailed') };
      }
    },
    [t]
  );

  /** Wipe all user data without touching the DB file or encryption key. */
  const clearAllData = useCallback(async (): Promise<ClearAllDataResult> => {
    try {
      const db = await getDatabase();
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM document_pages;');
        await db.runAsync('DELETE FROM documents;');
        await db.runAsync('DELETE FROM service_entries;');
        await db.runAsync('DELETE FROM fuel_entries;');
        await db.runAsync('DELETE FROM vehicle_costs;');
        await db.runAsync('DELETE FROM vehicles;');
        await db.runAsync('DELETE FROM service_types WHERE is_system = 0;');
        await db.runAsync('DELETE FROM payment_types WHERE is_system = 0;');
      });
      for (const directory of ['revloguum_images/', 'Revloguum_images/']) {
        const imageDirectory = FileSystem.documentDirectory + directory;
        const info = await FileSystem.getInfoAsync(imageDirectory);
        if (info.exists) {
          await FileSystem.deleteAsync(imageDirectory, { idempotent: true });
        }
      }
      return { success: true };
    } catch {
      return { success: false, error: t('settings.deleteAllFailed') };
    }
  }, [t]);

  return { exportDatabase, shareExportFile, importDatabase, clearAllData };
}
