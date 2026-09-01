# Validation and Regression Checks

Purpose: Schnell prüfen, ob Änderung wirklich safe ist.

## Fast Validation Sequence
1. Relevante Dateien auf direkte Fehler prüfen.
2. Projektweiter Typecheck.
3. Locale-JSON nach Übersetzungsänderungen parsen.
4. Kritische Flows auf einem Development Build testen.
5. `git diff --check` ausführen.

## Critical Flows for RevLog
- Vehicle add/edit/delete
- Vehicle management with service and payment intervals
- Fuel create/edit/delete
- Service create/edit/delete
- Payment create/edit/delete
- Grouped history rendering
- Entry detail navigation after edit
- Odometer recalculation across vehicle baseline, services, and fuel
- Document create/edit/reorder/delete for vehicle, service, and payment owners
- Encrypted image cleanup after replacement and owner deletion
- Export/import with service groups, custom types, photos, and documents
- PDF combinations with costs, notes, photos, documents, and document pages
- Notification rescheduling after interval, entry, or language changes

## Typical Regression Hotspots
- Navigation params nach Refactor
- Edit-Modals mit stale state
- Deduplizierte Komponenten mit alten Prop-Namen
- Migrationen bei bestehenden Datenbanken
- Cascading DB deletes before encrypted file paths are collected
- Service group edit flows that replace entry IDs
- Backup compatibility after authenticated metadata or schema changes
- Decrypted preview and generated PDF files in app cache

## Done Definition
- Kein TypeScript Error.
- Neue Features in beiden Sprachen bedienbar.
- Kein schwarzer Screen durch fehlende Navigation-Fallbacks.
- Backup-/PDF-/Datei-Lifecycle für betroffene Features geprüft.
- Verbleibende Android-/iOS-Gerätetests explizit dokumentiert.
