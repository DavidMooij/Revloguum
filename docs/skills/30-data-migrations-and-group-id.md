# Data Migrations and group_id Pattern

Purpose: Mehrere Service-Einträge pro Session robust modellieren.

## Why group_id
- Datum allein ist zu fragil (gleiches Datum kann unabhängige Services enthalten).
- group_id verbindet mehrere ServiceEntry-Zeilen zu einer Session.
- Einzelzeilen bleiben für Analytics erhalten.

## Schema Pattern
- service_entries erhält nullable group_id.
- Index auf group_id für schnelle Gruppierung.
- Bestehende Datensätze bleiben ohne group_id valide.

## Repository Pattern
- Create-Funktionen akzeptieren optional groupId.
- Query liefert group_id immer mit aus.
- Zusätzliche Group-Operationen:
  - getGroup(groupId)
  - deleteGroup(groupId)

## Hook Pattern
- Gruppierung in eine helper-Funktion auslagern.
- API für UI:
  - addServiceEntriesGroup
  - deleteServiceGroup
  - getServiceGroup

## UI Pattern
- AddEntry erstellt mehrere Blöcke und persistiert alle mit gemeinsamer group_id.
- History zeigt Group-Card statt isolierter Einzelkarten.
- Detail-View muss mit fehlender alter entryId umgehen (nach Reinsert/Edit).

## Export/Import
- group_id in Backup mitführen.
- Beim Import unverändert wiederherstellen.
