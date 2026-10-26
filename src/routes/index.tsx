import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Crown, Gift, PlayCircle, Radio, Star, Users, Video } from "lucide-react";
import hero from "@/assets/hero-bull.jpg";
import { CourseCard } from "@/components/site/CourseCard";
import { courses, liveClasses } from "@/lib/courses";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Chartसीखो — Learn Stock Market in Hindi & English" },
      { name: "description", content: "Live classes, recorded courses and free content to learn chart reading, options and price action — beginner to pro." },
      { property: "og:title", content: "Chartसीखो — Learn Stock Market in Hindi & English" },
      { property: "og:description", content: "Live classes, recorded courses and free stock-market learning, beginner to pro." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, lang } = useLang();
  const cats = [
    { icon: Radio, label: t("cat_live"), cls: "bg-destructive/10 text-destructive" },
    { icon: Video, label: t("cat_recorded"), cls: "bg-primary/10 text-primary" },
    { icon: Gift, label: t("cat_free"), cls: "bg-success/10 text-success" },
    { icon: Star, label: t("cat_popular"), cls: "bg-gold/20 text-foreground" },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-3xl bg-navy text-foreground-foreground">
        <img src={hero} alt="" width={1280} height={832} className="absolute inset-0 h-full w-full object-cover opacity-60 md:left-1/3 md:w-2/3 md:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-transparent" />
        <div className="relative max-w-xl p-6 sm:p-10 md:py-16">
          <span className="inline-block rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">{t("offer")}</span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
            {t("hero_1")}
            <br />
            <span className="text-gold">{t("hero_2")}</span>
          </h1>
          <p className="mt-3 opacity-85">{t("hero_sub")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/demo" className="inline-flex items-center gap-2 rounded-full bg-success px-5 py-3 font-semibold text-success-foreground hover:bg-success/90">
              <PlayCircle className="h-5 w-5" /> {t("demo_cta")}
            </Link>
            <Link to="/courses" className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/30 px-5 py-3 font-semibold hover:bg-navy-foreground/10">
              {t("explore")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 text-sm sm:gap-8">
            <div><p className="text-2xl font-bold">25K+</p><p className="opacity-70">{t("stats_students")}</p></div>
            <div><p className="text-2xl font-bold">40+</p><p className="opacity-70">{t("stats_courses")}</p></div>
            <div><p className="text-2xl font-bold">4.8★</p><p className="opacity-70">{t("stats_rating")}</p></div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cats.map(({ icon: Icon, label, cls }) => (
          <Link key={label} to="/courses" className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-card sm:flex-row sm:p-4 sm:text-left">
            <span className={`rounded-xl p-2.5 ${cls}`}><Icon className="h-5 w-5" /></span>
            <span className="text-xs font-semibold sm:text-sm">{label}</span>
          </Link>
        ))}
      </section>

      {/* Upcoming live */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("upcoming")}</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {liveClasses.map((c) => (
            <article key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex h-24 items-start rounded-xl bg-gradient-to-br from-navy to-primary p-3">
                {c.live && <span className="rounded bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">● LIVE</span>}
              </div>
              <h3 className="mt-3 font-semibold">{c.title[lang]}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground [&_svg]:shrink-0">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{t(c.day)}, {c.time}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.joining} {t("joining")}</span>
              </div>
              <Link to="/live/$classId" params={{ classId: c.id }} className={`mt-3 block w-full rounded-lg py-2 text-center text-sm font-semibold ${c.live ? "bg-primary text-primary-foreground" : "border border-primary text-primary"}`}>
                {c.live ? t("join_live") : t("remind")}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Popular */}
      <section className="mt-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("popular")}</h2>
          <Link to="/courses" className="text-sm font-semibold text-primary">{t("see_all")} →</Link>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.slice(0, 4).map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>

      {/* Membership */}
      <section className="mt-10 flex flex-col items-start gap-4 rounded-3xl bg-gradient-to-r from-primary to-navy p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-8">
        <Crown className="h-10 w-10 shrink-0 text-gold" />
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold">{t("membership_t")}</h2>
          <p className="mt-1 opacity-85">{t("membership_s")}</p>
        </div>
        <Link to="/plans" className="rounded-full bg-gold px-6 py-3 font-semibold text-navy hover:bg-gold/90">{t("membership_cta")}</Link>
      </section>
    </div>
  );
}
