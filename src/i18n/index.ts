import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { NativeModules, Platform } from "react-native";

import de from "./locales/de.json";
import en from "./locales/en.json";

const deviceLocale: string =
  Platform.OS === "ios"
    ? NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      "en"
    : NativeModules.I18nManager?.localeIdentifier || "en";

const languageCode = deviceLocale.split(/[-_]/)[0];

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: ["de", "en"].includes(languageCode) ? languageCode : "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
