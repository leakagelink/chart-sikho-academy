import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { liveClasses } from "@/lib/courses";
import { pageMeta } from "@/lib/route-meta";
import { LiveClassCombo } from "@/components/site/LiveClassCombo";

export const Route = createFileRoute("/sandbox/live")({
  head: () => pageMeta("YouTube + Jitsi Classroom Preview", "Try sample YouTube classes and Jitsi doubt sessions on Chartसीखो without connecting to a live service."),
  component: Screen,
});

const pastClasses = [
  { id: "p1", title: { en: "Support & Resistance Masterclass", hi: "सपोर्ट और रेज़िस्टेंस मास्टरक्लास" }, date: "18 Oct", time: "07:00 PM" },
  { id: "p2", title: { en: "Q&A Doubt Session", hi: "Q&A डाउट सेशन" }, date: "11 Oct", time: "07:00 PM" },
] as const;

function Screen() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [registered, setRegistered] = useState<string[]>([]);

  return (
    <div className="live-screen">
      <h1 className="screen-title font-display font-bold">{t("live_sample")}</h1>

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
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {liveClasses.map((c) => (
            <article key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-center font-display text-xs font-bold leading-tight text-gold">
                  {t(c.day)}<br />{c.time}
                </span>
                <div className="min-w-0">
                  {c.live && <span className="rounded bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">● LIVE</span>}
                  <h3 className="mt-1 font-semibold">{c.title[lang]}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{c.joining} {t("joining")}</p>
                </div>
              </div>
              {c.live ? (
                <Link to="/live/$classId" params={{ classId: c.id }} className="mt-3 block w-full rounded-lg bg-gold py-2 text-center text-sm font-bold text-navy hover:bg-gold/90">
                  {t("join_live")}
                </Link>
              ) : (
                <Button variant={registered.includes(c.id) ? "secondary" : "outline"} className="mt-3 w-full"
                  onClick={() => setRegistered((s) => (s.includes(c.id) ? s : [...s, c.id]))}>
                  {t(registered.includes(c.id) ? "registered" : "register")}
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
      {tab === "past" && (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {pastClasses.map((c) => (
            <article key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
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
