# RevLog Technical Reference

This document is the developer-facing companion to [README.md](README.md).

## Stack

- React Native + Expo
- TypeScript
- React Navigation
- Zustand
- Expo SQLite with SQLCipher support
- i18next

## Quick Commands

```bash
npm install
npm run start
npm run android
npm run ios
npx tsc --noEmit -p tsconfig.json
```

## Project Layout

```text
src/
  app/                # App root + navigation
  data/
    db/               # DB bootstrap, migrations, seeds
    repositories/     # SQLite repository implementations
  domain/
    entities/         # Domain models
    repositories/     # Repository interfaces
    services/         # Domain services
  hooks/              # Feature state/data orchestration
  i18n/               # Locale bootstrap and translations
  screens/            # Screens + shared UI components
  security/           # Key and encryption utilities
  store/              # Zustand global app store
  theme/              # Design tokens + readability helpers
  utils/              # Date/format/helper functions
```

## Data Model

Main entities:
- Vehicle
- ServiceEntry
- ServiceType
- FuelEntry
- VehicleCost

### Grouped Service Pattern

Multi-service workshop sessions are represented as multiple `ServiceEntry` rows linked by nullable `group_id`.

Why:
- Preserves row-level analytics
- Supports grouped UI in history
- Enables group-level edit/delete operations

## Database Migrations

Migration runner:
- [src/data/db/migrations/index.ts](src/data/db/migrations/index.ts)

Current migration set includes:
- v1 initial schema
- v2 images support
- v3 costs and fuel
- v4 fuel defaults
- v5 vehicle type
- v6 service type translation key
- v7 service grouping

## i18n Rules

Locales:
- [src/i18n/locales/en.json](src/i18n/locales/en.json)
- [src/i18n/locales/de.json](src/i18n/locales/de.json)

Rule:
- New UI copy must be added to both locales in the same change.

## UI Architecture Guidelines

- Keep screens as orchestrators
- Extract repeated sections to reusable components
- Prefer small composable parts over monolithic screens
- Use shared tokens from `theme` instead of ad-hoc styling

## Cost and Date Semantics

In costs:
- `once`: date is booking date
- `monthly`/`yearly`: date is recurring start date

## Readability Mode

Readability preferences are stored in app state and used by shared UI components/tokens.

Related files:
- [src/theme/readability.ts](src/theme/readability.ts)
- [src/store/appStore.ts](src/store/appStore.ts)

## Security Pointers

See [SECURITY.md](SECURITY.md) for:
- Threat model
- Encryption controls
- Known limitations