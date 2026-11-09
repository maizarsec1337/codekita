import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeading } from "@/components/academy/shared";
import { Button } from "@/components/ui/button";
import { isStaticFrontend } from "@/lib/mode";
export function ProfilePage() {
  const { t } = useTranslation("common");
  const auth = useAuth();
  if (isStaticFrontend) return <><PageHeading eyebrow={t("accountIdentity")} title={t("profile")} description={t("profileDemo")} /><div className="panel max-w-2xl p-7" role="status"><LockKeyhole className="mb-4 text-primary" size={25} /><p className="muted">{t("backendRequired")}</p></div></>;
  const user = auth.user;
  return <><PageHeading eyebrow={t("accountIdentity")} title={t("profile")} description={t("profileReal")} /><div className="panel max-w-2xl p-7"><div className="mb-7 flex items-center gap-4"><span className="rounded-2xl bg-primary/10 p-4 text-primary"><UserRound size={28} /></span><div><h2 className="text-xl">{user?.email.split("@")[0]}</h2><p className="mt-1 text-xs text-muted-foreground">{t("engineer")}</p></div></div><dl className="space-y-6"><div><dt className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Mail size={13} />{t("accountEmail")}</dt><dd className="break-all text-sm">{user?.email}</dd></div><div><dt className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={13} />{t("roles")}</dt><dd className="text-sm">{user?.roles.join(", ")}</dd></div><div><dt className="mb-2 text-xs text-muted-foreground">{t("accountId")}</dt><dd className="break-all font-mono text-xs">{user?.userId}</dd></div></dl><p className="muted mt-7 border-t border-border pt-5">{t("realDetails")}</p></div></>;
}
export function SettingsPage() {
  const { t } = useTranslation("common");
  const { logout } = useAuth();
  const [reduced, setReduced] = useState(() => { try { return localStorage.getItem("ck-reduced-motion") === "true"; } catch { return false; } });
  const [message, setMessage] = useState<"storageError" | "signOutError" | "">("");
  useEffect(() => { document.documentElement.dataset.reducedMotion = String(reduced); try { localStorage.setItem("ck-reduced-motion", String(reduced)); } catch { setMessage("storageError"); } }, [reduced]);
  return <><PageHeading eyebrow={t("focus")} title={t("settings")} description={t("settingsDescription")} /><div className="panel max-w-2xl p-6"><h2 className="mb-5 text-lg">{t("preferences")}</h2><label className="flex cursor-pointer items-start justify-between gap-5 border-t border-border py-5"><span><span className="block text-sm">{t("reduceMotion")}</span><span className="mt-2 block text-xs leading-6 text-muted-foreground">{t("reduceMotionDescription")}</span></span><input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--ck-primary))]" checked={reduced} onChange={(event) => setReduced(event.target.checked)} /></label><div className="border-t border-border py-5"><h3 className="text-sm">{t("appearance")}</h3><p className="muted mt-2">{t("appearanceDescription")}</p></div>{!isStaticFrontend && <div className="border-t border-border pt-5"><h3 className="text-sm">{t("sessionSecurity")}</h3><p className="muted my-3">{t("sessionDescription")}</p><Button variant="outline" onClick={() => { void logout().catch(() => setMessage("signOutError")); }}>{t("signOutDevice")}</Button></div>}<p role="status" className="mt-5 text-xs text-muted-foreground">{t(message || "localPreferences")}</p></div></>;
}