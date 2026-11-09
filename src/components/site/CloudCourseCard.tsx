import { Link } from "@tanstack/react-router";
import { BookOpen, User } from "lucide-react";
import { inr } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import { ProductSocial } from './ProductSocial';

type C = { id: string; title: string; price: number; sale_price: number | null; thumbnail_url: string; instructor: string; description: string };

export function CloudCourseCard({ course: c }: { course: C }) {
  const { t } = useLang();
  const sale = c.sale_price != null && c.sale_price < c.price ? c.sale_price : null;
  const now = sale ?? c.price;
  const off = sale != null && c.price > 0 ? Math.round((1 - sale / c.price) * 100) : 0;
  return (
    <article className="course-row course-motion group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-transform hover:-translate-y-1">
      <div className="course-cover relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
        <Link to="/courses/$courseId" params={{ courseId: c.id }} aria-label={c.title} className="absolute inset-0">
          {c.thumbnail_url?<img src={c.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />:<span className="grid h-full place-items-center"><BookOpen className="h-10 w-10 text-muted-foreground" /></span>}
        </Link>
        {now === 0 ? <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-bold text-success-foreground">FREE</span>
          : off > 0 && <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-navy">{off}% off</span>}
      </div>
      <div className="course-body flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-tight text-card-foreground">
          <Link to="/courses/$courseId" params={{ courseId: c.id }} className="transition-colors hover:text-primary hover:underline">{c.title}</Link>
        </h3>
        {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
        {c.instructor && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3.5 w-3.5" />{c.instructor}</p>}
        <div className="course-price mt-auto flex flex-wrap items-baseline gap-2 pt-3">
          <span className="text-lg font-bold text-gold">{now ? inr(now) : "FREE"}</span>
          {sale != null && <span className="text-xs text-muted-foreground line-through">{inr(c.price)}</span>}
        </div>
        <Link to="/courses/$courseId" params={{ courseId: c.id }} className="course-cta mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><BookOpen className="h-4 w-4" />{now ? t("buy_now") : t("enroll_free")}</Link>
        <ProductSocial kind="course" id={c.id} title={c.title}/>
      </div>
    </article>
  );
}
