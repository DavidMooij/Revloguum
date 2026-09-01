# Session Principles (RevLog)

Purpose: Schnell und stabil liefern, mit wenig Iterationen und wenig Token-Verbrauch.

## Core Rules
- Immer erst bestehende Patterns im Projekt lesen, dann implementieren.
- Keine Kommentare im Code hinzufügen, außer explizit gewünscht.
- Kein UI-Text hardcoden. Immer i18n Keys in beiden Dateien pflegen.
- Bestehende Komponenten wiederverwenden, statt neue Einzelfall-UI zu bauen.
- Doppelte Logik in Hooks/Helpers extrahieren.
- Kleine, gezielte Patches statt große unkontrollierte Massenänderungen.

## Implementation Order
1. Scope und betroffene Files identifizieren.
2. Datenmodell/Repo/Hook zuerst, dann UI.
3. i18n direkt mitziehen (en + de).
4. Typecheck am Ende jeder Feature-Unit.

## Quality Gate
- Keine neuen TypeScript-Fehler.
- Keine regressionsanfälligen Inline-Hacks.
- Alte Flows bleiben nutzbar (Backwards Compatibility bei Navigation/Detail Views).
