---
name: "Validation and documentation"
description: "Use when validating changes, preparing a release, updating Markdown documentation, reviewing launch readiness, or changing user-visible behavior in Revloguum."
applyTo: "**/*.md,package.json,app.json,eas.json"
---
# Validation and documentation

- Keep documentation factual and verifiable against the current source. Do not claim a feature, test suite, permission, platform guarantee, or security property that is not implemented.
- Keep `README.md` concise and contributor-oriented; put threat details and data handling in `SECURITY.md`, contribution workflow in `CONTRIBUTING.md`, and functional behavior in `USECASES.md`.
- Use relative links and verify every linked local file exists.
- When behavior changes, cross-check relevant use cases and update both the feature description and documented limitations.
- Use the scripts that actually exist in `package.json`. Do not document nonexistent lint, test, or build commands.
- Minimum validation for TypeScript changes: `./node_modules/.bin/tsc --noEmit --pretty false`.
- After i18n changes, parse both locale JSON files and verify corresponding English and German keys.
- Run `git diff --check` before completion.
- For migrations, encryption, backup, PDF, navigation, and destructive actions, include focused manual regression steps in the handoff or contribution checklist.
- Never imply that TypeScript compilation replaces device testing. State remaining Android/iOS checks explicitly.
