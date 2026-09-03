---
name: "Data and migrations"
description: "Use when changing domain entities, SQLite repositories, database schema, migrations, hooks that mutate persisted data, imports, or deletion behavior in Revloguum."
applyTo: "src/domain/**/*.ts,src/data/**/*.ts,src/hooks/**/*.ts,src/utils/updateVehicleOdometer.ts"
---
# Data and migrations

- Keep the dependency direction `domain -> data -> hooks -> UI`; UI must not own persistence rules.
- Follow existing entity and `SQLite*Repo` patterns. Use typed inputs and parameterized SQLite statements.
- Add migrations as `src/data/db/migrations/vN_description.ts`, append them to `MIGRATIONS`, and never rewrite an already released migration.
- Migrations must work for both fresh installs and existing databases. Preserve old rows and provide explicit defaults or backfills.
- Enable and respect foreign keys. Add indexes for owner, filter, and ordering columns used by repository queries.
- For aggregate state such as vehicle odometer, recalculate from all authoritative sources instead of applying one-way incremental updates.
- Mutations must cover create, edit, delete, grouped records, cascading owners, notification resync, and any shared store refresh.
- Schema changes must be reflected in backup export/import and full-data deletion.
- When deleting database rows that reference encrypted files, collect file paths before the rows cascade away, then remove files only after successful persistence.
- Avoid `any` in new domain and repository APIs. Existing untyped backup compatibility code may remain localized.
- Validate affected persistence flows on both a fresh database and an upgraded existing database.