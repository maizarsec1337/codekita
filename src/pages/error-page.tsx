import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useInRouterContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Compass, Info, LayoutDashboard, LockKeyhole, RotateCcw, ServerCrash, ShieldCheck, Wrench } from "lucide-react";
import { Logo } from "@/components/academy/shared";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import "@/styles/error-page.css";
export type ErrorCode = 403 | 404 | 500 | 503;
const illustrations = { 403: ShieldCheck, 404: Compass, 500: ServerCrash, 503: Wrench };
interface ErrorPageProps {
    code: ErrorCode;
    /** Only supply a retry when an actual failed operation can be attempted again. */
    onRetry?: () => void | Promise<void>;
    /** A full navigation escapes a failed render tree, including a broken router. */
    reloadDocument?: boolean;
}
function RecoveryLink({ to, reloadDocument, children, secondary = false }: {
    to: string;
    reloadDocument: boolean;
    children: ReactNode;
    secondary?: boolean;
}) {
    const inRouter = useInRouterContext();
    return <Button asChild variant={secondary ? "outline" : "default"} className="ck-error-action">
    {inRouter ? <Link to={to} reloadDocument={reloadDocument}>{children}</Link> : <a href={to}>{children}</a>}
  </Button>;
}
export function ErrorPage({ code, onRetry, reloadDocument = false }: ErrorPageProps) {
    const { t } = useTranslation("errors");
    const { t: common } = useTranslation("common");
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);
    const heading = useRef<HTMLHeadingElement>(null);
    const retryLock = useRef(false);
    const [retrying, setRetrying] = useState(false);
    const [retryFailed, setRetryFailed] = useState(false);
    const Icon = illustrations[code];
    const title = t(`${code}.title`);
    const documentTitle = t("documentTitle", { code, title: t(`${code}.label`) });
    useEffect(() => {
        const previousTitle = document.title;
        const previousRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
        const robots = previousRobots ?? document.createElement("meta");
        const previousContent = robots.getAttribute("content");
        robots.name = "robots";
        robots.content = "noindex, nofollow";
        if (!previousRobots)
            document.head.append(robots);
        document.title = documentTitle;
        return () => {
            document.title = previousTitle;
            if (!previousRobots)
                robots.remove();
            else if (previousContent === null)
                robots.removeAttribute("content");
            else
                robots.content = previousContent;
        };
    }, [documentTitle]);
    // Announce route changes without moving focus away from the language selector.
    useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [code]);
    async function retry() {
        if (!onRetry || retryLock.current)
            return;
        retryLock.current = true;
        setRetrying(true);
        setRetryFailed(false);
        try {
            await onRetry();
        }
        catch {
            setRetryFailed(true);
        }
        finally {
            retryLock.current = false;
            setRetrying(false);
        }
    }
    return (<div className="ck-error">
      <a href="#error-content" className="sr-only z-50 rounded bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{common("skip")}</a>
      <header className="ck-error-header">
        <Logo reloadDocument={reloadDocument}/>
        <LanguageSwitcher />
      </header>
      <main id="error-content" className="ck-error-main" aria-labelledby="error-heading" tabIndex={-1}>
        <div className="ck-error-layout">
          <div className="ck-error-copy">
            <p className="ck-error-kicker">{t(`${code}.label`)}</p>
            <h1 id="error-heading" ref={heading} tabIndex={-1}>{title}</h1>
            <p className="ck-error-description">{t(`${code}.description`)}</p>
            <nav className="ck-error-actions" aria-label={t("recovery")}>
              <RecoveryLink to="/" reloadDocument={reloadDocument}><ArrowLeft size={16} aria-hidden="true"/>{t("home")}</RecoveryLink>
              {((!isLoading && user)) && <RecoveryLink to="/dashboard" reloadDocument={reloadDocument} secondary><LayoutDashboard size={16} aria-hidden="true"/>{t("dashboard")}</RecoveryLink>}
              {code >= 500 && onRetry && <Button type="button" variant="ghost" className="ck-error-action" disabled={retrying} onClick={() => { void retry(); }}>
                <RotateCcw size={16} aria-hidden="true"/>{t(retrying ? "retrying" : "retry")}
              </Button>}
            </nav>
            <p role="status" className={retryFailed ? "ck-error-retry-message" : "sr-only"}>{retryFailed ? t("retryFailed") : ""}</p>
            <p className="ck-error-hint"><Info size={15} aria-hidden="true"/><span>{t(`${code}.hint`)}</span></p>
          </div>
          <div className="ck-error-panel">
            <div className="ck-error-panel-bar" aria-hidden="true"><span className="ck-error-panel-dots"><i /><i /><i /></span><span>codekita / academy</span><LockKeyhole size={13}/></div>
            <div className="ck-error-art">
              <div className="ck-error-symbol" role="img" aria-label={t(`${code}.illustration`)}><Icon size={34} strokeWidth={1.5} aria-hidden="true"/></div>
              <p className="ck-error-code"><span className="sr-only">{t("code", { code })}</span><span aria-hidden="true">{code}</span></p>
            </div>
            <div className="ck-error-panel-foot"><span>{t(`${code}.label`)}</span></div>
          </div>
        </div>
      </main>
      <footer className="ck-error-footer"><p>CodeKita.id</p><p>{t("footer")}</p></footer>
    </div>);
}
export function ForbiddenPage() { return <ErrorPage code={403}/>; }
export function ServerErrorPage() { return <ErrorPage code={500}/>; }
export function ServiceUnavailablePage() { return <ErrorPage code={503}/>; }
