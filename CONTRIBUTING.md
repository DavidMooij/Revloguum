# Contributing to Revloguum

Thank you for improving Revloguum. Contributions should preserve its local-first behavior, encrypted data lifecycle, and English/German user experience.

## Before You Start

- Use a public issue for bugs and feature proposals that contain no sensitive information.
- Follow [SECURITY.md](SECURITY.md) for vulnerabilities; do not disclose them in a public issue.
- Keep pull requests focused. Discuss broad architecture changes before implementing them.
- Do not include real vehicle records, receipts, document pages, passwords, keys, or exported backups in issues or commits.

## Development Setup

Install dependencies from the lockfile:

```bash
npm ci
```

Run an Android development build:

```bash
npm run android
```

On macOS, use `npm run ios` for iOS. The complete app depends on native modules such as SQLCipher and platform key storage, so Expo Go is not a supported runtime.

Forks intended for distribution must replace the owner, EAS project ID, Android package, and iOS bundle identifier in [app.json](app.json).

## Architecture

Follow the existing dependency direction:

1. Domain entities and services in `src/domain/`
2. SQLite repositories and migrations in `src/data/`
3. Feature behavior in `src/hooks/`
4. Navigation and UI in `src/app/` and `src/screens/`

Zustand owns shared application state. React Navigation owns navigation. Persistent data access belongs in repositories rather than screens.

## Coding Rules

- Read the nearest existing implementation before introducing a new pattern.
- Keep changes small and preserve public APIs unless the feature requires a change.
- Reuse shared components, theme tokens, repository methods, and encryption helpers.
- Keep screens focused on orchestration and extract genuinely reusable UI.
- Do not add hardcoded user-facing strings. Add matching keys to both locale files.
- Do not log personal vehicle data, document contents, passwords, keys, or decrypted paths.
- Do not include generated native folders, build output, local databases, encryption fixtures, or editor state.

Project coding-agent rules are in [.github/copilot-instructions.md](.github/copilot-instructions.md). Additional implementation checklists are in [docs/skills](docs/skills).

## Persistent Data and Migrations

- Add a new numbered migration for every schema change.
- Append migrations to `src/data/db/migrations/index.ts`; do not modify a migration already used by existing installations.
- Preserve existing rows with safe defaults and explicit backfills.
- Update entities, repositories, hooks, backup/restore, deletion, and documentation together.
- Test both a fresh database and an upgrade from the previous schema.

## Encrypted Files and Documents

- Persist media through `src/security/imageEncryption.ts`.
- Treat create, replace, delete, owner deletion, backup, restore, PDF export, and cache behavior as one lifecycle.
- Collect encrypted file paths before deleting rows that cascade.
- Never change backup authenticated metadata or cryptographic parameters without backward compatibility for existing backups.

## Documentation and Localization

- Update [USECASES.md](USECASES.md) when functional behavior or limitations change.
- Update [README.md](README.md), [PRIVACY.md](PRIVACY.md), and [SECURITY.md](SECURITY.md) when public behavior, data flow, permissions, or guarantees change.
- Keep English and German locale files synchronized.
- Verify every relative documentation link points to a tracked file.

## Validation

Run before submitting a pull request:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/en.json','utf8')); JSON.parse(require('fs').readFileSync('src/i18n/locales/de.json','utf8'))"
npm audit --omit=dev
git diff --check
```

Do not run `npm audit fix --force`. Review proposed dependency changes against Expo compatibility and test native builds before committing an upgrade.

There is no automated test suite yet. Manually test the affected flows on a development build. Depending on the change, cover:

- vehicle create, edit, management, and delete;
- service, grouped service, fuel, and payment create/edit/delete;
- odometer recalculation after lowering or deleting entries;
- service and payment interval persistence and reminder rescheduling;
- document create/edit/reorder/delete from camera and gallery;
- encrypted media cleanup after replacement and owner deletion;
- backup export, wrong-password failure, restore, and old-backup compatibility;
- PDF combinations for costs, notes, photos, documents, and document pages;
- English/German switching, long labels, empty states, and Clear View mode.

State which platforms and flows were tested in the pull request. TypeScript success alone is not sufficient for native, migration, encryption, or navigation changes.

## Pull Requests

- Explain the user-visible outcome and why the chosen design fits existing patterns.
- List schema, security, privacy, and compatibility effects.
- Include screenshots for visual changes without exposing personal data.
- Include validation commands and manual device results.
- Call out remaining risks or untested platform behavior.

By contributing, you agree that your contribution is licensed under the repository's [MIT License](LICENSE).