---
name: "UI and localization"
description: "Use when changing React Native screens, navigation, components, forms, modals, visual styling, accessibility, or user-facing copy in Revloguum."
applyTo: "src/screens/**/*.tsx,src/app/navigation/**/*.{ts,tsx},src/i18n/**/*.{ts,json},src/theme/**/*.ts"
---
# UI and localization

- Read the nearest screen and shared component before adding a new UI pattern.
- Reuse theme tokens, typography, spacing, haptics, and existing form/modal components.
- Keep screens focused on orchestration. Extract a component when it owns meaningful state, validation, or repeated UI, not merely to shorten a file.
- Preserve the app's existing dark visual language and readability mode. Use `readableColor` where surrounding code does.
- Forms must expose validation near the relevant field, preserve edit values, prevent duplicate saves, and remain usable with the keyboard open.
- Long lists should use `FlashList` or the existing pagination pattern. Supply stable keys and avoid expensive inline work in render items.
- Use icon buttons for familiar actions and provide adequate touch targets. Avoid nested touchables that trigger both parent and child actions.
- Register every new screen in both `src/app/navigation/routes.ts` and `src/app/navigation/RootNavigator.tsx`.
- Keep route parameters explicit and typed in `RootStackParamList`.
- Put every user-visible string, placeholder, alert, empty state, and accessibility label in both `src/i18n/locales/en.json` and `src/i18n/locales/de.json`.
- Use stable keys grouped by feature. Do not reuse an unrelated key merely because its current text matches.
- Verify long German text, keyboard behavior, scrollability, and empty/loading/error states.
- Validate affected screens on the mobile platforms they support.