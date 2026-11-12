import { NotificationLink } from '@/components/site/NotificationLink';
import { Link } from "@tanstack/react-router";
import { Bell, Search, User } from "lucide-react";
import { AppCourses, AppEbook, AppHome, AppLive, AppProfile } from "./AppIcons";
import { useEffect, useRef, useState } from "react";
import type { DictKey } from "@/lib/i18n";
import { useBranding } from "@/lib/branding";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getStudentNotifications } from '@/lib/admin.functions';
import { usePanelAccess } from '@/hooks/use-panel-access';

export function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t("pref_lang")} className="flex shrink-0 rounded-full border border-border bg-muted p-0.5 text-xs font-semibold">
      {(["en", "hi"] as const).map((l) => (
        <Button variant="ghost" size="sm"
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`h-9 rounded-full px-2.5 text-xs sm:px-3 ${lang === l ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground"}`}
        >
          {l === "en" ? "EN" : "हिं"}
        </Button>
      ))}
    </div>
  );
}

export function NotificationsBell() {
  const { t } = useLang();
  const { session } = useAuth();
  const fetchNotifications = useServerFn(getStudentNotifications);
  const notifications = useQuery({ queryKey:['student-notifications',session?.user.id], queryFn:()=>fetchNotifications(), enabled:!!session, retry:false });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" aria-label={t("notif_title")} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="app-bell relative h-11 w-11 shrink-0 rounded-full text-muted-foreground">
        <Bell className="h-5 w-5" />
        {notifications.data?.some(n=>!n.read_at)&&<span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />}
      </Button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 max-h-[70dvh] overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-card sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80">
          <p className="px-3 py-2 font-display text-sm font-bold text-foreground">{t("notif_title")}</p>
          {session ? <><Button asChild variant="link"><Link to="/notifications">{t('see_all')}</Link></Button>{notifications.data?.map(n=><NotificationLink key={n.id} link={n.notification_campaigns?.link_url} onNavigate={()=>setOpen(false)} className="block rounded-md px-3 py-2 hover:bg-muted"><p className="text-sm font-semibold">{n.notification_campaigns?.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{n.notification_campaigns?.message}</p></NotificationLink>)}{!notifications.data?.length&&<p className="px-3 py-2 text-sm text-muted-foreground">{t('admin_empty')}</p>}</> : <p className="px-3 py-2 text-sm text-muted-foreground">{t('admin_empty')}</p>}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useLang();
  const { session } = useAuth();
  const panelAccess = usePanelAccess();
  const brandLogo = useBranding();
  return (
    <header className="app-header blueprint-chrome sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 px-3 sm:flex sm:gap-3 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-1.5 sm:shrink-0 sm:gap-2">
          {brandLogo ? <img src={brandLogo} alt="" width={40} height={40} className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10" /> : <span className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" aria-hidden="true" />}
          <span className="truncate font-display text-lg font-bold text-foreground sm:text-xl">
            Chart<span className="text-gold">सीखो</span>
          </span>
        </Link>
        <nav className="ml-2 hidden min-w-0 gap-5 whitespace-nowrap text-sm font-medium lg:flex">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="text-foreground/80 hover:text-primary">{t("nav_home")}</Link>
          <Link to="/courses" activeProps={{ className: "text-primary" }} className="text-foreground/80 hover:text-primary">{t("nav_courses")}</Link>
          <Link to="/ebooks" activeProps={{ className: "text-primary" }} className="text-foreground/80 hover:text-primary">{t("nav_ebooks")}</Link>
          <Link to="/live-classes" className="text-foreground/80 hover:text-primary">{t("cat_live")}</Link>
          {panelAccess && <Button asChild variant="link" size="sm" className="h-auto p-0"><Link to="/admin">{t('real_admin')}</Link></Button>}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden lg:inline-flex"><Link to="/courses" aria-label={t("search")}><Search className="h-5 w-5" /></Link></Button>
          <NotificationsBell />
          <LangToggle />
          {session ? (
            <>
              <Button asChild className="hidden lg:inline-flex"><Link to="/dashboard">{t("my_learning")}</Link></Button>
              <Button asChild variant="secondary" size="icon" className="hidden h-11 w-11 shrink-0 rounded-full lg:inline-flex"><Link to="/profile" aria-label={t("profile")}><User className="h-5 w-5" /></Link></Button>
            </>
          ) : (
            <Button asChild className="hidden lg:inline-flex"><Link to="/auth" search={{ redirect: undefined }}>{t("login")} / {t("signup")}</Link></Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const { t } = useLang();
  const { session } = useAuth();
  // Floating app dock: the active tab gets a gold pill (TanStack sets data-status="active"); Live sits raised in the centre.
  const item = "app-dock-item flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 text-center text-[10.5px] font-semibold leading-tight";
  const pill = "app-dock-pill grid h-8 w-12 place-items-center rounded-full";
  return (
    <nav aria-label={t("nav_home")} className="mobile-navigation app-dock fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="app-dock-bar mx-auto flex h-16 max-w-xl items-stretch">
        <Link to="/" activeOptions={{ exact: true }} className={item}><span className={pill}><AppHome size={22} /></span><span className="truncate">{t("nav_home")}</span></Link>
        <Link to="/courses" className={item}><span className={pill}><AppCourses size={22} /></span><span className="truncate">{t("nav_courses")}</span></Link>
        <Link to="/live-classes" className={`${item} app-dock-center`}><span className="app-dock-live grid place-items-center rounded-full"><AppLive size={26} /></span><span className="truncate">{t("cat_live")}</span></Link>
        <Link to="/ebooks" className={item}><span className={pill}><AppEbook size={22} /></span><span className="truncate">{t("nav_ebooks")}</span></Link>
        <Link to={session ? "/profile" : "/auth"} className={item}><span className={pill}><AppProfile size={22} /></span><span className="truncate">{t("profile")}</span></Link>
      </div>
    </nav>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="blueprint-footer mt-12 bg-navy pb-28 pt-8 text-navy-foreground lg:pb-10">
      <div className="w-full px-4 text-sm">
        <p className="font-display text-lg font-bold">Chart<span className="text-gold">सीखो</span></p>
        <p className="mt-2 max-w-xl opacity-80">{t("disclaimer")}</p>
        <p className="mt-6 opacity-60">© {new Date().getFullYear()} Chartसीखो</p>
      </div>
    </footer>
  );
}
