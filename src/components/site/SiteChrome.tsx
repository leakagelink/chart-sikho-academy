import { Link } from "@tanstack/react-router";
import { Bell, BookOpen, GraduationCap, Home, Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DictKey } from "@/lib/i18n";
import logo from "@/assets/logo.jpeg.asset.json";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language" className="flex rounded-full border border-border bg-muted p-0.5 text-xs font-semibold">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-3 py-1 transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}

const sampleNotifs: { t: DictKey; s: DictKey }[] = [
  { t: "notif_1_t", s: "notif_1_s" },
  { t: "notif_2_t", s: "notif_2_s" },
  { t: "notif_3_t", s: "notif_3_s" },
];

export function NotificationsBell() {
  const { t } = useLang();
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
      <button aria-label={t("notif_title")} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="relative rounded-full p-2 text-muted-foreground hover:bg-muted">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-72 rounded-2xl border border-border bg-card p-2 shadow-card">
          <p className="px-3 py-2 font-display text-sm font-bold text-navy">{t("notif_title")}</p>
          {sampleNotifs.map((n) => (
            <div key={n.t} className="rounded-xl px-3 py-2 hover:bg-muted">
              <p className="text-sm font-semibold">{t(n.t)}</p>
              <p className="text-xs text-muted-foreground">{t(n.s)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useLang();
  const { session } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="Chartसीखो" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
          <span className="font-display text-xl font-bold text-navy">
            Chart<span className="text-success">सीखो</span>
          </span>
        </Link>
        <nav className="ml-4 hidden gap-6 text-sm font-medium md:flex">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="text-foreground/80 hover:text-primary">{t("nav_home")}</Link>
          <Link to="/courses" activeProps={{ className: "text-primary" }} className="text-foreground/80 hover:text-primary">{t("nav_courses")}</Link>
          <Button asChild variant="link" size="sm" className="h-auto p-0"><Link to="/sandbox">{t("sandbox")}</Link></Button>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/courses" aria-label={t("search")} className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted sm:block"><Search className="h-5 w-5" /></Link>
          <NotificationsBell />
          <LangToggle />
          {session ? (
            <>
              <Link to="/dashboard" className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:block">{t("my_learning")}</Link>
              <Link to="/profile" aria-label={t("profile")} className="rounded-full bg-muted p-2 text-navy"><User className="h-5 w-5" /></Link>
            </>
          ) : (
            <Link to="/auth" search={{ redirect: undefined }} className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:block">{t("login")} / {t("signup")}</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const { t } = useLang();
  const { session } = useAuth();
  const cls = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background md:hidden">
      <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "!text-primary" }} className={cls}><Home className="h-5 w-5" />{t("nav_home")}</Link>
      <Link to="/courses" activeProps={{ className: "!text-primary" }} className={cls}><BookOpen className="h-5 w-5" />{t("nav_courses")}</Link>
      <Link to="/sandbox" activeProps={{ className: "!text-primary" }} className={cls}><GraduationCap className="h-5 w-5" />{t("sandbox")}</Link>
      {session ? (
        <>
          <Link to="/dashboard" activeProps={{ className: "!text-primary" }} className={cls}><GraduationCap className="h-5 w-5" />{t("my_learning")}</Link>
          <Link to="/profile" activeProps={{ className: "!text-primary" }} className={cls}><User className="h-5 w-5" />{t("profile")}</Link>
        </>
      ) : (
        <Link to="/auth" search={{ redirect: undefined }} className={cls}><User className="h-5 w-5" />{t("login")}</Link>
      )}
    </nav>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 bg-navy pb-24 pt-10 text-navy-foreground md:pb-10">
      <div className="mx-auto max-w-6xl px-4 text-sm">
        <p className="font-display text-lg font-bold">Chart<span className="text-success">सीखो</span></p>
        <p className="mt-2 max-w-xl opacity-80">{t("disclaimer")}</p>
        <p className="mt-6 opacity-60">© {new Date().getFullYear()} Chartसीखो</p>
      </div>
    </footer>
  );
}
