# i18n and Copy Discipline

Purpose: Kein Text-Drift zwischen Deutsch und Englisch.

## Mandatory Rules
- Jeder neue UI-Text bekommt sofort Keys in en.json und de.json.
- Keine temporären Hardcoded-Texte im JSX.
- Einheitliche Key-Struktur je Feature.

## Naming Convention
- Bereich zuerst, dann Kontext, dann Zweck.
- Beispiel-Muster:
  - vehicles.garage.addVehicle
  - history.group.session
  - addEntry.noteExamples.tyres

## Placeholder Strategy
- Per-Service-Type Beispiele als eigene Keys pflegen.
- Platzhalter müssen sprachlich natürlich sein, keine 1:1 Wort-für-Wort-Übersetzung erzwingen.

## Review Check
- Existiert jeder neue Key in beiden Sprachen?
- Wird jeder neue Key tatsächlich verwendet?
- Gibt es alte, ungenutzte Keys nach Refactor?
