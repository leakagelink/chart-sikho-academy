import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Crown, PlayCircle } from "lucide-react";
import { AppCertificate, AppCourses, AppEbook, AppLive, AppSeminar, AppWebinar } from "@/components/site/AppIcons";
import hero from "@/assets/hero-bull.jpg";
import { HomeProductShelf } from "@/components/site/HomeProductShelf";
import { ScheduledLiveClasses } from "@/components/site/ScheduledLiveClasses";
import { CloudCourseCard } from "@/components/site/CloudCourseCard";
import { catalogQuery } from "@/lib/catalog-query";
import { useLang } from "@/lib/i18n";
import { useSuspenseQuery } from '@tanstack/react-query';
import { bannerQuery } from '@/lib/banner-query';
import { WebsiteBanners } from '@/components/site/WebsiteBanners';
import { productQuery } from '@/lib/product-query';
import { EbookPurchase } from '@/components/site/EbookPurchase';
import { Button } from '@/components/ui/button';
import { AppDownloadCard } from '@/components/site/AppDownload';

export const Route = createFileRoute("/")({
  loader: async ({context}) => {await Promise.all([context.queryClient.ensureQueryData(catalogQuery()),context.queryClient.ensureQueryData(bannerQuery()),context.queryClient.ensureQueryData(productQuery())]);},
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
  const {data:products}=useSuspenseQuery(productQuery());
  const {data:catalog}=useSuspenseQuery(catalogQuery());
  const { t } = useLang();
  const cats = [
    { icon: AppLive, label: t("cat_live"), to: "/live-classes" },
    { icon: AppCourses, label: t("nav_courses"), to: "/courses" },
    { icon: AppWebinar, label: t("cat_webinars"), to: "/webinars" },
    { icon: AppEbook, label: t("cat_ebooks"), to: "/ebooks" },
    { icon: AppSeminar, label: t("cat_seminars"), to: "/seminars" },
    { icon: AppCertificate, label: t("cat_certificates"), to: "/certificates" },
  ] as const;
  return (
    <div className="mobile-home w-full min-w-0 px-4">
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

        </div>
      </section>

      }/>
      {/* Categories */}
      <section className="home-categories mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {cats.map(({ icon: Icon, label, to }) => (
          <Link key={label} to={to} className="home-shortcut flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card">
            <span className="home-shortcut-icon rounded-full bg-gold/15 p-3 text-gold"><Icon className="h-5 w-5" /></span>
            <span className="text-xs font-semibold">{label}</span>
          </Link>
        ))}
      </section>

      <HomeProductShelf title={t('upcoming')} seeAll={<Button asChild variant="link" className="shrink-0 gap-0 p-0"><Link to="/live-classes">{t('see_all')}<ChevronRight className="h-4 w-4" /></Link></Button>}>
        <ScheduledLiveClasses />
      </HomeProductShelf>

      <HomeProductShelf title={t('popular')} seeAll={<Button asChild variant="link" className="shrink-0 gap-0 p-0"><Link to="/courses" search={{type:'courses'}}>{t('see_all')}<ChevronRight className="h-4 w-4" /></Link></Button>}>
        {catalog.map(c => <CloudCourseCard key={c.id} course={c} />)}
      </HomeProductShelf>

      <HomeProductShelf title={t('cat_webinars')} seeAll={<Button asChild variant="link" className="shrink-0 gap-0 p-0"><Link to="/webinars">{t('see_all')}<ChevronRight className="h-4 w-4" /></Link></Button>}>
        <ScheduledLiveClasses kind="webinar" />
      </HomeProductShelf>

      <HomeProductShelf title={t('cat_seminars')} seeAll={<Button asChild variant="link" className="shrink-0 gap-0 p-0"><Link to="/seminars">{t('see_all')}<ChevronRight className="h-4 w-4" /></Link></Button>}>
        <ScheduledLiveClasses kind="seminar" />
      </HomeProductShelf>

      <HomeProductShelf ebooks title={t('nav_ebooks')} seeAll={<Button asChild variant="link" className="shrink-0 gap-0 p-0"><Link to="/ebooks">{t('see_all')}<ChevronRight className="h-4 w-4" /></Link></Button>}>
        {products.ebooks.length ? <>
          {products.ebooks.map(book=><article key={book.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <div className="aspect-[3/4] w-full shrink-0 overflow-hidden bg-muted">
              {book.cover_url?<img src={book.cover_url} alt={book.title} loading="lazy" decoding="async" className="block h-full w-full object-contain"/>:<div className="grid h-full place-items-center"><BookOpen className="h-12 w-12 text-muted-foreground"/></div>}
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h3 className="break-words font-display text-lg font-semibold leading-snug">{book.title}</h3>
              {book.description&&<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{book.description.replace(/^#+\s*/gm,'').replace(/\*\*|__|`/g,'')}</p>}
              <EbookPurchase book={book}/>
            </div>
          </article>)}
        </>:<p className="mt-4 text-muted-foreground">{t('ebooks_empty')}</p>}
      </HomeProductShelf>

      {/* Membership */}
      <section className="home-membership mt-10 flex flex-col items-start gap-4 rounded-3xl bg-gradient-to-r from-primary to-navy p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-8">
        <Crown className="h-10 w-10 shrink-0 text-gold" />
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold">{t("membership_t")}</h2>
          <p className="mt-1 opacity-85">{t("membership_s")}</p>
        </div>
        <Link to="/plans" className="rounded-full bg-gold px-6 py-3 font-semibold text-navy hover:bg-gold/90">{t("membership_cta")}</Link>
      </section>

      <AppDownloadCard />
    </div>
  );
}
