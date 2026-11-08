import { Link, NavLink } from "react-router-dom";
import { Menu, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/academy/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
const links = [["Explore", "/"], ["Learning Paths", "/paths"], ["Academy", "/academy"], ["Labs", "/labs"], ["Leaderboard", "/leaderboard"]];
export function Navbar() {
  const { t } = useTranslation("navigation");
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl"><div className="page-container flex h-[76px] items-center justify-between gap-4"><Logo /><nav aria-label={t("Main navigation")} className="hidden items-center gap-5 lg:flex">{links.map(([label, href]) => <NavLink end={href === "/"} key={href} to={href} className={({ isActive }) => `text-[13px] font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{t(label)}</NavLink>)}</nav><div className="flex items-center gap-2"><LanguageSwitcher className="hidden lg:inline-flex" />{isLoading ? <div className="h-9 w-20 animate-pulse rounded-lg bg-card" aria-label={t("Checking session")} /> : user ? <Link to="/dashboard" className="flex items-center gap-2 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-semibold text-primary">{user.email[0].toUpperCase()}</span><span className="hidden sm:inline">{t("My workspace")}</span></Link> : <><Link to="/login" className="hidden px-3 text-sm text-muted-foreground hover:text-foreground sm:block">{t("Log in")}</Link><Button size="sm" asChild><Link to="/register">{t("Get started")}<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></>}<Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label={t("Open navigation")} className="lg:hidden"><Menu size={21} /></Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>{t("Explore CodeKita")}</SheetTitle><SheetDescription>{t("Your next engineering milestone starts here.")}</SheetDescription></SheetHeader><nav aria-label={t("Mobile navigation")} className="flex flex-col gap-2 px-6">{[...links, ...(user ? [["Dashboard", "/dashboard"]] : [["Log in", "/login"], ["Create account", "/register"]])].map(([label, href]) => <Link onClick={() => setOpen(false)} className="rounded-lg p-3 text-sm hover:bg-accent" key={href} to={href}>{t(label)}</Link>)}<LanguageSwitcher className="mt-3 self-start" /></nav></SheetContent></Sheet></div></div></header>;
}