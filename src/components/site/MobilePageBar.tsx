import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n";

/** Phone/app screen title bar (hidden on desktop): back to Home, page title and an optional trailing action. */
export function MobilePageBar({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  const { t } = useLang();
  return (
    <div className="app-pagebar mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 lg:hidden">
      <Link to="/" aria-label={t("nav_home")} className="app-pagebar-back grid size-10 shrink-0 place-items-center rounded-xl text-gold"><ArrowLeft className="size-5" /></Link>
      <div className="min-w-0">
        <h1 className="screen-heading truncate font-display text-2xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action ?? <span aria-hidden="true" />}
    </div>
  );
}
