import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Award, Bell, BookOpen, Calendar, ClipboardCheck, Crown, FileText, PlayCircle, Radio, Users, Video } from "lucide-react";
import educator from "@/assets/course-educator-thumb.webp";
import hero from "@/assets/hero-bull.jpg";
import { LiveClassCard } from "@/components/site/LiveClassCard";
import { ScheduledLiveClasses } from "@/components/site/ScheduledLiveClasses";
import { CloudCourseCard } from "@/components/site/CloudCourseCard";
import { catalogQuery } from "@/lib/catalog-query";
import { liveClasses, inr } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useSuspenseQuery } from '@tanstack/react-query';
import { categoryQuery } from '@/lib/category-query';
import { bannerQuery } from '@/lib/banner-query';
import { WebsiteBanners } from '@/components/site/WebsiteBanners';
import { productQuery } from '@/lib/product-query';
import { EbookPurchase } from '@/components/site/EbookPurchase';

export const Route = createFileRoute("/")({
  loader: async ({context}) => {await Promise.all([context.queryClient.ensureQueryData(catalogQuery()),context.queryClient.ensureQueryData(categoryQuery()),context.queryClient.ensureQueryData(bannerQuery()),context.queryClient.ensureQueryData(productQuery())]);},
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
  const {data:homeCategories}=useSuspenseQuery(categoryQuery());
  const {data:products}=useSuspenseQuery(productQuery());
  const {data:catalog}=useSuspenseQuery(catalogQuery());
  const { t, lang } = useLang();
  const { session } = useAuth();
  const meta = session?.user?.user_metadata as { full_name?: string } | undefined;
  const firstName = (meta?.full_name ?? "").trim().split(" ")[0] || t("student_fallback");
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => { setHour(new Date().getHours()); }, []);
  const greet = hour === null ? t("greet_morning") : hour < 12 ? t("greet_morning") : hour < 17 ? t("greet_afternoon") : t("greet_evening");
  const cats = [
    { icon: BookOpen, label: t("cat_mycourses"), to: "/dashboard" },
    { icon: Radio, label: t("cat_live"), to: "/sandbox/live" },
    { icon: Video, label: t("cat_webinars"), to: "/sandbox/live" },
    { icon: FileText, label: t("cat_ebooks"), to: "/ebooks" },
    { icon: ClipboardCheck, label: t("cat_tests"), to: "/sandbox/quiz" },
    { icon: Award, label: t("cat_certificates"), to: "/sandbox/certificates" },
  ] as const;
  return (
    <div className="w-full px-4">
      {/* Greeting — blueprint home dashboard header */}
      <section className="home-greeting mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/15 font-display text-lg font-bold text-gold">
            {firstName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold text-foreground sm:text-2xl">
              {t("hello")}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground">{greet}</p>
          </div>
        </div>
        <Link to="/sandbox/support" aria-label={t("notifications")} className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground shadow-card">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
        </Link>
      </section>

      {/* Continue learning — blueprint progress card */}
      <section className="home-progress mt-5 flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="aspect-square w-16 shrink-0 self-center overflow-hidden rounded-xl bg-navy sm:w-20">
          <img src={educator} alt="" width={160} height={160} loading="eager" decoding="async" className="block h-full w-full object-cover object-center" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{t("continue_course_t")}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[68%] rounded-full bg-gold" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">68% {t("completed")}</p>
        </div>
        <Link to="/sandbox/learn" className="shrink-0 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:bg-gold/90 sm:px-6">
          {t("start_learning")}
        </Link>
      </section>

      {/* Hero */}
      <WebsiteBanners page="home" fallback={
      <section className="home-marketing relative mt-6 overflow-hidden rounded-3xl bg-navy text-navy-foreground">
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
            <Link to="/courses" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-semibold text-navy hover:bg-gold/90">
              <PlayCircle className="h-5 w-5" /> {t("explore")}
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 text-sm sm:gap-8">
            <div><p className="text-2xl font-bold">25K+</p><p className="opacity-70">{t("stats_students")}</p></div>
            <div><p className="text-2xl font-bold">40+</p><p className="opacity-70">{t("stats_courses")}</p></div>
            <div><p className="text-2xl font-bold">4.8★</p><p className="opacity-70">{t("stats_rating")}</p></div>
          </div>
        </div>
      </section>

      }/>
      {/* Categories */}
      <section className="home-categories mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {cats.map(({ icon: Icon, label, to }) => (
          <Link key={label} to={to} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card">
            <span className="rounded-full bg-gold/15 p-3 text-gold"><Icon className="h-5 w-5" /></span>
            <span className="text-xs font-semibold">{label}</span>
          </Link>
        ))}
      </section>

      {/* Upcoming live */}
      {homeCategories.length > 0 && <section className="mt-8">
        <h2 className="font-display text-2xl font-bold text-foreground">{t('admin_nav_categories')}</h2>
        <div className="home-categories mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {homeCategories.map(category => <Link key={category.id} to="/courses" search={{cat:category.slug}} className="flex min-w-0 flex-col items-center gap-3 rounded-lg border border-border bg-card p-4 text-center shadow-card">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">{category.icon_url ? <img src={category.icon_url} alt="" className="h-12 w-12 object-contain" /> : <BookOpen className="h-6 w-6" />}</span>
            <span className="w-full break-words text-sm font-semibold">{category.name}</span>
          </Link>)}
        </div>
      </section>}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("upcoming")}</h2>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <ScheduledLiveClasses />
          {liveClasses.map((c) => <LiveClassCard key={c.id} session={c} />)}
        </div>
      </section>

      {/* Popular */}
      <section className="mt-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("popular")}</h2>
          <Link to="/courses" className="text-sm font-semibold text-primary">{t("see_all")} →</Link>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.slice(0, 4).map((c) => <CloudCourseCard key={c.id} course={c} />)}
        </div>
      </section>

      <section className="home-ebooks mt-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="min-w-0 font-display text-2xl font-bold text-foreground">{t('nav_ebooks')}</h2>
          <Link to="/ebooks" className="shrink-0 text-sm font-semibold text-primary">{t('see_all')} →</Link>
        </div>
        {products.ebooks.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {products.ebooks.slice(0,4).map(book=><article key={book.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <div className="aspect-[3/4] w-full shrink-0 overflow-hidden bg-muted">
              {book.cover_url?<img src={book.cover_url} alt={book.title} loading="lazy" decoding="async" className="block h-full w-full object-contain"/>:<div className="grid h-full place-items-center"><BookOpen className="h-12 w-12 text-muted-foreground"/></div>}
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h3 className="break-words font-display text-lg font-semibold leading-snug">{book.title}</h3>
              {book.description&&<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{book.description}</p>}
              <p className="mt-auto pt-3 text-lg font-bold text-primary">{inr(book.price)}</p>
              <EbookPurchase book={book}/>
            </div>
          </article>)}
        </div>:<p className="mt-4 text-muted-foreground">{t('ebooks_empty')}</p>}
      </section>

      {/* Membership */}
      <section className="home-marketing mt-10 flex flex-col items-start gap-4 rounded-3xl bg-gradient-to-r from-primary to-navy p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-8">
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
