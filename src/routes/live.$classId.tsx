import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, BellRing, Calendar, Info, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { liveClasses } from "@/lib/courses";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/live/$classId")({
  head: ({ params }) => {
    const c = liveClasses.find((x) => x.id === params.classId);
    const title = c ? `${c.title.en} — Chartसीखो Live` : "Live Class — Chartसीखो";
    return {
      meta: [
        { title },
        { name: "description", content: "Join free live stock-market classes on Chartसीखो." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Join free live stock-market classes on Chartसीखो." },
      ],
    };
  },
  component: LivePage,
});

function LivePage() {
  const { classId } = Route.useParams();
  const { t, lang } = useLang();
  const cls = liveClasses.find((x) => x.id === classId);
  const key = `cs-remind-${classId}`;
  const [reminded, setReminded] = useState(false);
  useEffect(() => {
    setReminded(localStorage.getItem(key) === "1");
  }, [key]);
  if (!cls) return null;

  function toggleRemind() {
    const next = !reminded;
    setReminded(next);
    localStorage.setItem(key, next ? "1" : "0");
    toast.success(next ? t("reminder_set") : t("reminder_off"));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {t("nav_home")}
      </Link>
      {/* Demo player — real streaming is wired up at launch */}
      <div className="mt-4 flex aspect-video flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-navy to-primary text-navy-foreground">
        {cls.live && <span className="rounded bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">● LIVE</span>}
        <p className="mt-3 px-6 text-center font-display text-xl font-bold">{cls.title[lang]}</p>
        <p className="mt-2 flex items-center gap-2 text-sm opacity-80"><Info className="h-4 w-4" />{t("live_demo_player")}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{t(cls.day)}, {cls.time}</span>
        <span className="flex items-center gap-1"><Users className="h-4 w-4" />{cls.joining} {t("joining")}</span>
      </div>
      <button onClick={toggleRemind} className={`mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold ${reminded ? "bg-success/10 text-success" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
        {reminded ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {reminded ? t("reminder_on") : t("remind")}
      </button>
      <p className="mt-6 rounded-2xl bg-muted p-4 text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
