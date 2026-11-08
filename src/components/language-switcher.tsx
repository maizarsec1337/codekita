import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

/** Native select provides keyboard and screen-reader support without a second menu system. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { t, i18n } = useTranslation("common");
  return <label className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-2 text-xs text-foreground ${className}`}>
    <Languages size={16} aria-hidden="true" />
    <span className="sr-only">{t("language")}</span>
    <select aria-label={t("language")} value={i18n.resolvedLanguage === "en" ? "en" : "id"} onChange={(event) => void i18n.changeLanguage(event.target.value)} className="max-w-[128px] cursor-pointer bg-transparent py-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <option value="id">{t("indonesian")}</option><option value="en">{t("english")}</option>
    </select>
  </label>;
}