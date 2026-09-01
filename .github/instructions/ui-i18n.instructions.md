---
name: "React Native UI and i18n"
description: "Use when changing React Native screens, navigation, components, forms, modals, visual styling, accessibility, or user-facing copy in Revloguum."
applyTo: "src/screens/**/*.tsx,src/app/navigation/**/*.{ts,tsx},src/i18n/**/*.{ts,json},src/theme/**/*.ts"
---
# React Native UI and i18n

- Keep screens as orchestrators. Extract reusable UI when the same pattern appears in two or more places or when a screen mixes several large responsibilities.
- Prefer existing components under `src/screens/components/` and feature component folders before adding a new component.
- Use `colors`, `spacing`, `radius`, `typography`, and `typeScale` from `src/theme/`. Do not introduce arbitrary font sizes or duplicate palette values.
- Preserve the established screen structure, touch behavior, safe-area handling, loading states, empty states, confirmation dialogs, and haptic feedback.
- Use icon buttons for familiar actions and provide adequate touch targets. Avoid nested touchables that trigger both parent and child actions.
- Register every new screen in both `src/app/navigation/routes.ts` and `src/app/navigation/RootNavigator.tsx`.
- Keep route parameters explicit and typed in `RootStackParamList`.
- Put every user-visible string, placeholder, alert, empty state, and accessibility label in both `src/i18n/locales/en.json` and `src/i18n/locales/de.json`.
- Use stable keys grouped by feature. Do not reuse an unrelated key merely because its current text matches.
- Verify long German text, keyboard behavior, scrollability, and empty/loading/error states.

See `docs/skills/20-rn-ui-flow-and-components.md` and `docs/skills/40-i18n-and-copy-discipline.md`.
