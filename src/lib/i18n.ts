import i18n, { type InitOptions } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enCommon from "@/locales/en/common.json";
import idCommon from "@/locales/id/common.json";
import enNavigation from "@/locales/en/navigation.json";
import idNavigation from "@/locales/id/navigation.json";
import enDashboard from "@/locales/en/dashboard.json";
import idDashboard from "@/locales/id/dashboard.json";
import enCourses from "@/locales/en/courses.json";
import idCourses from "@/locales/id/courses.json";
import enAuth from "@/locales/en/auth.json";
import idAuth from "@/locales/id/auth.json";
import enErrors from "@/locales/en/errors.json";
import idErrors from "@/locales/id/errors.json";

export function createLanguageDetector() {
  const detector = new LanguageDetector();
  // Storage can become unavailable after startup (privacy settings or quota).
  // Keep the language switch usable even when a preference cannot be saved.
  detector.addDetector({
    name: "savedPreference",
    lookup() {
      try { return window.localStorage.getItem("codekita-language") ?? undefined; }
      catch { return undefined; }
    },
    cacheUserLanguage(language) {
      try { window.localStorage.setItem("codekita-language", language); }
      catch { /* The in-memory language still works without persistence. */ }
    },
  });
  return detector;
}

// Shared by the application and fresh-instance detection/fallback tests.
export const i18nOptions: InitOptions = {
  resources: { en: { common: enCommon, navigation: enNavigation, dashboard: enDashboard, courses: enCourses, auth: enAuth, errors: enErrors }, id: { common: idCommon, navigation: idNavigation, dashboard: idDashboard, courses: idCourses, auth: idAuth, errors: idErrors } },
  ns: ["common", "navigation", "dashboard", "courses", "auth", "errors"],
  defaultNS: "common",
  fallbackLng: "id",
  supportedLngs: ["id", "en"],
  load: "languageOnly",
  keySeparator: false,
  returnEmptyString: false,
  returnNull: false,
  detection: { order: ["savedPreference", "navigator"], caches: ["savedPreference"] },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
};

void i18n.use(createLanguageDetector()).use(initReactI18next).init(i18nOptions);

function updateDocumentLanguage(language: string) {
  if (typeof document !== "undefined") document.documentElement.lang = language.startsWith("en") ? "en" : "id";
}
updateDocumentLanguage(i18n.resolvedLanguage ?? i18n.language ?? "id");
i18n.on("languageChanged", updateDocumentLanguage);

export default i18n;