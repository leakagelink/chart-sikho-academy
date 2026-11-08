import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { liveClasses } from "@/lib/courses";
import { pageMeta } from "@/lib/route-meta";
import { LiveClassCard, LiveClassThumbnail } from "@/components/site/LiveClassCard";
import { LiveClassCombo } from "@/components/site/LiveClassCombo";

export const Route = createFileRoute("/sandbox/live")({
  validateSearch: (search: Record<string, unknown>): { view?: 'webinars' } => search['view'] === 'webinars' ? { view: 'webinars' } : {},
  head: () => pageMeta("YouTube + Jitsi Classroom Preview", "Try sample YouTube classes and Jitsi doubt sessions on Chartसीखो without connecting to a live service."),
  component: Screen,
});

const pastClasses = [
  { id: "p1", title: { en: "Support & Resistance Masterclass", hi: "सपोर्ट और रेज़िस्टेंस मास्टरक्लास" }, date: "18 Oct", time: "07:00 PM" },
  { id: "p2", title: { en: "Q&A Doubt Session", hi: "Q&A डाउट सेशन" }, date: "11 Oct", time: "07:00 PM" },
] as const;

function Screen() {
  const { t, lang } = useLang();
  const { view } = Route.useSearch();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [registered, setRegistered] = useState<string[]>([]);

  return (
    <div className="live-screen">
      <h1 className="screen-title font-display font-bold">{t(view === 'webinars' ? "cat_webinars" : "live_sample")}</h1>

      {/* Upcoming / Past tabs — blueprint live classes screen */}
      <div className="mt-5 grid w-full max-w-xs grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
        {(["upcoming", "past"] as const).map((k) => (
          <Button key={k} variant={tab === k ? "default" : "ghost"} onClick={() => setTab(k)} aria-pressed={tab === k}
            className="rounded-full py-2">
            {t(k === "upcoming" ? "upcoming_tab" : "past_tab")}
          </Button>
        ))}
      </div>

      {tab === "upcoming" && (
        <div className="live-class-grid mt-5 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {liveClasses.map((c) => (
            <LiveClassCard key={c.id} session={c} action={c.live ? undefined : (
              <Button variant={registered.includes(c.id) ? "secondary" : "outline"} className="w-full"
                onClick={() => setRegistered((s) => s.includes(c.id) ? s : [...s, c.id])}>
                {t(registered.includes(c.id) ? "registered" : "register")}
              </Button>
            )} />
          ))}
        </div>
      )}
      {tab === "past" && (
        <div className="live-class-grid mt-5 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {pastClasses.map((c) => (
            <article key={c.id} className="live-class-card flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card">
              <LiveClassThumbnail title={c.title[lang]} />
              <div className="flex items-start gap-3 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-center font-display text-xs font-bold leading-tight text-muted-foreground">
                  {c.date}<br />{c.time}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{c.title[lang]}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{c.date}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <LiveClassCombo />
    </div>
  );
}
