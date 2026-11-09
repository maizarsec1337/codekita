import { isStaticFrontend } from "@/lib/mode";
import { useTranslation } from "react-i18next";

export function DemoBanner() {
  const { t } = useTranslation("common");
  if (!isStaticFrontend) return null;
  return <div role="note" className="border-b border-codekita-warning/30 bg-codekita-warning/10 px-4 py-3 text-center text-xs leading-5 text-foreground">{t("demo")} {t("backendRequired")}</div>;
}