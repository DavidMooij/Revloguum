import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getDatabase } from "../data/db/database";
import { SQLiteVehicleRepo } from "../data/repositories/SQLiteVehicleRepo";
import { SQLiteServiceEntryRepo } from "../data/repositories/SQLiteServiceEntryRepo";
import { SQLiteFuelRepo } from "../data/repositories/SQLiteFuelRepo";
import { SQLiteVehicleCostRepo } from "../data/repositories/SQLiteVehicleCostRepo";
import { decryptImage } from "@/security/imageEncryption";
import { formatDate } from "../utils/date";
import { formatCost, formatOdometer, formatVehicleName } from "../utils/format";
import * as FileSystem from "expo-file-system/legacy";
import { ServiceTypeLabelService } from "../domain/services/ServiceTypeLabelService";

export interface PdfExportOptions {
  vehicleId: string;
  includeService: boolean;
  includeFuel: boolean;
  includeCosts: boolean;
  includePhotos: boolean;
  includeCostValues: boolean;
  includeNotes: boolean;
  dateFrom?: number;
  dateTo?: number;
}

export type PdfExportResult =
  | { success: true; fileUri: string }
  | { success: false; error: string };

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function imageToDataUri(path: string): Promise<string | null> {
  try {
    const uri = path.endsWith(".enc") ? await decryptImage(path) : path;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = path.includes(".png") ? "png" : "jpeg";
    return `data:image/${ext};base64,${base64}`;
  } catch (e) {
    console.warn("PDF export: failed to load image", path, e);
    return null;
  }
}

export function usePdfExport() {
  const { t } = useTranslation();
  const generatePdf = useCallback(
    async (options: PdfExportOptions): Promise<PdfExportResult> => {
      try {
        const db = await getDatabase();
        const vehicle = await new SQLiteVehicleRepo(db).getById(
          options.vehicleId,
        );
        if (!vehicle) return { success: false, error: "Vehicle not found" };

        const inRange = (ts: number) =>
          (options.dateFrom === undefined || ts >= options.dateFrom) &&
          (options.dateTo === undefined || ts <= options.dateTo);

        let serviceSection = "";
        let serviceCount = 0;
        if (options.includeService) {
          const entries = await new SQLiteServiceEntryRepo(db).fetchFiltered({
            vehicleId: options.vehicleId,
            limit: 1000,
          });
          const filtered = entries.filter((e) => inRange(e.dateTs));
          serviceCount = filtered.length;

          const blocks = await Promise.all(
            filtered.map(async (e) => {
              let photosHtml = "";
              if (options.includePhotos && e.imagePaths?.length) {
                const dataUris = await Promise.all(
                  e.imagePaths.map(imageToDataUri),
                );
                photosHtml = `<div class="photo-grid">${dataUris
                  .filter(Boolean)
                  .map((d) => `<img src="${d}" />`)
                  .join("")}</div>`;
              }
              return `
                <div class="entry-block">
                  <div class="entry-header">
                    <span class="entry-title">${escapeHtml(ServiceTypeLabelService.getLabel({ name: e.serviceTypeName, translationKey: e.translationKey }, t))}</span>
                    ${options.includeCostValues && e.cost != null ? `<span class="entry-cost">${formatCost(e.cost)}</span>` : ""}
                  </div>
                  <div class="entry-meta">${formatDate(e.dateTs)} · ${formatOdometer(e.odometerKm)}</div>
                  ${options.includeNotes && e.notes ? `<div class="entry-notes">${escapeHtml(e.notes)}</div>` : ""}
                  ${photosHtml}
                </div>`;
            }),
          );

          serviceSection = `
            <h2>Service History</h2>
            ${blocks.join("")}`;
        }

        let fuelSection = "";
        let fuelCount = 0;
        if (options.includeFuel) {
          const fuel = await new SQLiteFuelRepo(db).fetchFiltered({
            vehicleId: options.vehicleId,
            limit: 1000,
          });
          const filtered = fuel.filter((f) => inRange(f.dateTs));
          fuelCount = filtered.length;
          const rows = filtered
            .map(
              (f) => `
              <tr>
                <td>${formatDate(f.dateTs)}</td>
                <td>${formatOdometer(f.odometerKm)}</td>
                <td>${f.liters.toFixed(2)} L</td>
                ${options.includeCostValues ? `<td class="cost-cell">${formatCost(f.cost)}</td>` : ""}
                ${options.includeNotes ? `<td>${escapeHtml(f.notes ?? "")}</td>` : ""}
              </tr>`,
            )
            .join("");
          fuelSection = `
            <h2>Fuel History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Odometer</th><th>Liters</th>
                  ${options.includeCostValues ? "<th>Cost</th>" : ""}
                  ${options.includeNotes ? "<th>Notes</th>" : ""}
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`;
        }

        let costsSection = "";
        if (options.includeCosts) {
          const costs = await new SQLiteVehicleCostRepo(db).getAll(
            options.vehicleId,
          );
          const filtered = costs.filter((c) => inRange(c.dateTs));
          const rows = filtered
            .map(
              (c) => `
              <tr>
                <td>${formatDate(c.dateTs)}</td>
                <td>${escapeHtml(c.category)}</td>
                ${options.includeCostValues ? `<td class="cost-cell">${formatCost(c.amount)}</td>` : ""}
                ${options.includeNotes ? `<td>${escapeHtml(c.notes ?? "")}</td>` : ""}
              </tr>`,
            )
            .join("");
          costsSection = `
            <h2>Other Costs</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Category</th>
                  ${options.includeCostValues ? "<th>Amount</th>" : ""}
                  ${options.includeNotes ? "<th>Notes</th>" : ""}
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`;
        }

        const html = `
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                @page { margin: 30px 34px 46px 34px; }
                * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                body {
                  font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
                  color: #18181B;
                  margin: 0;
                  padding: 0 0 40px 0;
                  font-size: 12px;
                  background: #ffffff;
                } 
                .cover {
                  border: 1px solid #E4DAFB;
                  border-radius: 14px;
                  padding: 32px 34px;
                  margin-bottom: 26px;
                }
                .cover-eyebrow {
                  font-size: 10px;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  color: #8B5CF6;
                  font-weight: 700;
                  margin-bottom: 10px;
                }
                .cover-title {
                  font-size: 28px;
                  font-weight: 800;
                  letter-spacing: -0.5px;
                  margin: 0 0 6px 0;
                  color: #18181B;
                }
                .cover-sub {
                  font-size: 12.5px;
                  color: #71717A;
                  margin-bottom: 22px;
                }
                .cover-stats {
                  display: flex;
                  gap: 12px;
                }
                .cover-stat {
                  border: 1px solid #EDE7FB;
                  border-radius: 10px;
                  padding: 10px 16px;
                  flex: 1;
                }
                .cover-stat-label {
                  font-size: 9px;
                  text-transform: uppercase;
                  letter-spacing: 0.6px;
                  color: #A1A1AA;
                  margin-bottom: 3px;
                }
                .cover-stat-value {
                  font-size: 15px;
                  font-weight: 700;
                  color: #18181B;
                }
                h2 {
                  font-size: 13.5px;
                  font-weight: 700;
                  color: #18181B;
                  margin: 30px 0 2px 0;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #8B5CF6;
                }
                h2:first-of-type { margin-top: 0; }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                th {
                  text-align: left;
                  padding: 8px 10px;
                  font-size: 9px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  color: #71717A;
                  border-bottom: 1px solid #E4E4E7;
                }
                td {
                  padding: 9px 10px;
                  font-size: 11px;
                  border-bottom: 1px solid #F1F1F3;
                  vertical-align: top;
                  color: #27272A;
                }
                .cost-cell { font-weight: 700; color: #18181B; }
                .entry-block {
                  border: 1px solid #ECECEF;
                  border-radius: 10px;
                  padding: 14px 16px;
                  margin-top: 10px;
                  page-break-inside: avoid;
                }
                .entry-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: baseline;
                  margin-bottom: 6px;
                }
                .entry-title { font-size: 15px; font-weight: 700; color: #18181B; }
                .entry-meta { font-size: 12px; font-weight: 600; color: #52525B; }
                .entry-cost { font-size: 12px; font-weight: 700; color: #8B5CF6; }
                .entry-notes { font-size: 11px; color: #52525B; margin-top: 4px; line-height: 1.5; }
                .photo-grid {
                  margin-top: 10px;
                  font-size: 0;
                }
                .photo-grid img {
                  display: inline-block;
                  width: 160px;
                  height: 120px;
                  object-fit: cover;
                  border-radius: 8px;
                  border: 1px solid #ECECEF;
                  margin: 0 8px 8px 0;
                }
              </style>
            </head>
            <body>
              <div class="cover">
                <div class="cover-eyebrow">Vehicle Report</div>
                <div class="cover-title">${escapeHtml(
                  formatVehicleName(
                    vehicle.make,
                    vehicle.model,
                    vehicle.nickname,
                  ),
                )}</div>
                <div class="cover-sub">${vehicle.year ? `${vehicle.year} · ` : ""}Generated ${formatDate(Date.now())}</div>
                <div class="cover-stats">
                  <div class="cover-stat">
                    <div class="cover-stat-label">Odometer</div>
                    <div class="cover-stat-value">${formatOdometer(vehicle.currentOdometer)}</div>
                  </div>
                  ${
                    options.includeService
                      ? `<div class="cover-stat"><div class="cover-stat-label">Service entries</div><div class="cover-stat-value">${serviceCount}</div></div>`
                      : ""
                  }
                  ${
                    options.includeFuel
                      ? `<div class="cover-stat"><div class="cover-stat-label">Fuel entries</div><div class="cover-stat-value">${fuelCount}</div></div>`
                      : ""
                  }
                </div>
              </div>

              ${serviceSection}
              ${fuelSection}
              ${costsSection}
            </body>
          </html>`;

        const { uri } = await Print.printToFileAsync({ html, base64: false });

        const filename = `revloguum-export-${formatDate(Date.now())}.pdf`;
        const finalUri = FileSystem.cacheDirectory + filename;
        await FileSystem.copyAsync({ from: uri, to: finalUri });

        return { success: true, fileUri: finalUri };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    },
    [],
  );

  const shareGeneratedPdf = useCallback(async (fileUri: string) => {
    const available = await Sharing.isAvailableAsync();
    if (!available) return { success: false, error: "Sharing not available" };
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      dialogTitle: "Save PDF",
      UTI: "com.adobe.pdf",
    });
    return { success: true };
  }, []);

  return { generatePdf, shareGeneratedPdf };
}
