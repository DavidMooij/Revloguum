# Feature Implementation Checklist

Use this for every non-trivial change.

## 1) Discovery (minimal, focused)
- Betroffene Screens, Hooks, Repositories und Entities lokalisieren.
- Prüfen, ob ähnliche Funktion bereits existiert (copy-with-intent statt neu erfinden).
- Vorhandene Style- und Navigation-Pattern übernehmen.

## 2) Data First
- Falls notwendig: Entity-Typen erweitern.
- Repo-Methoden anpassen oder ergänzen.
- Hook API so designen, dass UI simpel bleibt.
- Bei persistenten Änderungen eine neue nummerierte Migration hinzufügen.
- Den vollständigen Lifecycle prüfen: Create, Edit, Delete, Cascade, Datei-Cleanup, Backup und Restore.

## 3) UI Second
- Bestehende Bausteine verwenden (Cards, Fields, Modals, Buttons).
- Komplexe Bereiche in Komponenten auslagern.
- State klar trennen: create/edit, loading, selected item.

## 4) i18n Pflicht
- Neue Keys in en.json und de.json ergänzen.
- Benennung konsistent halten (feature.section.action).
- Platzhalter-Beispiele auch übersetzen.

## 5) Validation
- TypeScript prüfen.
- Beide Locale-Dateien nach i18n-Änderungen parsen.
- `git diff --check` ausführen.
- Geänderte Flows manuell gedanklich testen:
  - Create
  - Edit
  - Delete
  - Navigation back/forward
  - Backup/Restore
  - PDF-Export
  - Verschlüsselte Dateien und Cleanup

## 6) Delivery
- Kurz dokumentieren: was geändert, warum, welche Dateien.
- Risiken benennen (falls vorhanden).
- README, SECURITY, PRIVACY und usecases.md bei verändertem Verhalten oder Datenfluss aktualisieren.
