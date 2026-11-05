import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, BellRing, Calendar, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { liveClasses } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LiveClassCombo } from "@/components/site/LiveClassCombo";

export const Route = createFileRoute("/live/$classId")({
  head: ({ params }) => {
    const c = liveClasses.find((x) => x.id === params.classId);
    const title = c ? `${c.title.en} — Chartसीखो Live` : "Live Class — Chartसीखो";
    return {
      meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
        { title },
        { name: "description", content: "Preview YouTube classes and Jitsi doubt sessions on Chartसीखो. Live services are not active during testing." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Preview YouTube classes and Jitsi doubt sessions on Chartसीखो. Live services are not active during testing." },
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
    <div className="w-full px-4 pt-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {t("nav_home")}
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold">{cls.title[lang]}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{t(cls.day)}, {cls.time}</span>
        <span className="flex items-center gap-1"><Users className="h-4 w-4" />{cls.joining} {t("joining")}</span>
      </div>
      <LiveClassCombo />
      <Button onClick={toggleRemind} variant={reminded ? "secondary" : "default"} className="mt-5">
        {reminded ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {reminded ? t("reminder_on") : t("remind")}
      </Button>
      <p className="mt-6 rounded-2xl bg-muted p-4 text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
