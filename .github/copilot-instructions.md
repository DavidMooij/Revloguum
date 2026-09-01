# Revloguum Project Instructions

## Project Context

- Revloguum is a local-first React Native app built with Expo and TypeScript.
- The architecture flows from `src/domain/` to `src/data/` to `src/hooks/` to `src/screens/`.
- SQLite repositories own persistence. Zustand holds shared application state. React Navigation owns navigation.
- User-facing copy is available in English and German through i18next.
- The database, persistent images, document pages, and exported backups are encrypted.

## Working Rules

1. Read the nearest existing implementation before changing behavior.
2. Keep changes narrowly scoped and preserve existing public APIs unless the task requires otherwise.
3. Implement data model and repository changes before hooks and UI.
4. Reuse shared components, theme tokens, encryption helpers, and repository patterns.
5. Never hardcode user-facing text. Update both locale files in the same change.
6. Treat create, edit, delete, backup, restore, PDF export, and file cleanup as one feature lifecycle.
7. Add a numbered migration for every persistent schema change and preserve existing user data.
8. Do not log keys, passwords, decrypted content, personal vehicle data, or document contents.
9. Update `README.md`, `SECURITY.md`, `PRIVACY.md`, and `USECASES.md` when behavior or guarantees change.
10. Do not run `expo export`, native builds, dependency upgrades, or destructive Git commands unless the task requires them or the user requests them.

## Validation

- Run `./node_modules/.bin/tsc --noEmit --pretty false` after TypeScript changes.
- Parse both locale JSON files after translation changes.
- Run `git diff --check` before finishing.
- There is currently no automated test suite. State which behavior was validated and which device flows still require manual testing.

## Detailed Guidance

- UI, navigation, component reuse, and i18n: `.github/instructions/ui-i18n.instructions.md`
- Entities, repositories, migrations, and data lifecycle: `.github/instructions/data-migrations.instructions.md`
- Encryption, documents, backup, PDF, and file cleanup: `.github/instructions/security-files.instructions.md`
- Validation and documentation discipline: `.github/instructions/validation-docs.instructions.md`
- Existing implementation checklists: `docs/skills/`
