import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Hand, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { liveClasses } from "@/lib/courses";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/sandbox/live")({
  head: () => pageMeta("Sample Live Classroom", "Preview class discussion and a sample clip with no live broadcast."),
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
  const [hand, setHand] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t("live_sample")}</h1>

      {/* Upcoming / Past tabs — blueprint live classes screen */}
      <div className="mt-5 grid w-full max-w-xs grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
        {(["upcoming", "past"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k}
            className={`rounded-full py-2 ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {t(k === "upcoming" ? "upcoming_tab" : "past_tab")}
          </button>
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

      {/* Classroom preview */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section>
          <video controls playsInline className="aspect-video w-full rounded-2xl bg-navy" aria-label={t("sample_video")}>
            <source src="/media/chart-sample.webm" type="video/webm" />
            <source src="/media/chart-sample.mp4" type="video/mp4" />
          </video>
          <p className="my-3 text-sm text-muted-foreground">{t("sample_video")}</p>
          <Button variant="outline" aria-pressed={hand} onClick={() => setHand(!hand)}><Hand />{t(hand ? "hand_raised" : "raise_hand")}</Button>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold">{t("chat")}</h2>
          <p className="mt-2 text-xs text-muted-foreground">{t("chat_sample")}</p>
          <div className="my-4 h-64 space-y-2 overflow-y-auto border-y border-border py-3" aria-live="polite">
            {messages.map((m, i) => <p key={i} className="break-words rounded-md bg-muted p-3 text-sm">{m}</p>)}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!message.trim()) return; setMessages((s) => [...s, message.trim()]); setMessage(""); }}>
            <input required maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} aria-label={t("chat")} className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3" />
            <Button type="submit" size="icon" aria-label={t("send")} title={t("send")}><Send /></Button>
          </form>
        </section>
      </div>
    </>
  );
}
