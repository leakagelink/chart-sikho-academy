import { Link } from "@tanstack/react-router";
import { Calendar, Users } from "lucide-react";
import educator from "@/assets/course-educator-thumb.webp";
import { Button } from "@/components/ui/button";
import { liveClasses } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import type { ReactNode } from "react";

export function LiveClassThumbnail({ title }: { title: string }) {
  return <div className="live-class-cover relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
    <img src={educator} alt={title} loading="lazy" decoding="async" className="block h-full w-full object-contain" />
  </div>;
}

export function LiveClassCard({ session, action }: { session: (typeof liveClasses)[number]; action?: ReactNode }) {
  const { t, lang } = useLang();
  return <article className="live-class-card flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card">
    <Link to="/live/$classId" params={{ classId: session.id }} className="relative block shrink-0">
      <LiveClassThumbnail title={session.title[lang]} />
      {session.live && <span className="absolute left-3 top-3 rounded bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">● LIVE</span>}
    </Link>
    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
      <Link to="/live/$classId" params={{ classId: session.id }} className="hover:text-primary"><h3 className="break-words font-semibold leading-snug">{session.title[lang]}</h3></Link>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 shrink-0" />{t(session.day)}, {session.time}</span>
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 shrink-0" />{session.joining} {t("joining")}</span>
      </div>
      <div className="mt-auto pt-1">{action ?? <Button asChild variant={session.live ? "default" : "outline"} className="w-full"><Link to="/live/$classId" params={{ classId: session.id }}>{t(session.live ? "join_live" : "remind")}</Link></Button>}</div>
    </div>
  </article>;
}