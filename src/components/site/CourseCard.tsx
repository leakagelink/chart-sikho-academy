import { Link } from "@tanstack/react-router";
import educator from "@/assets/course-educator.jpg";
import { Star } from "lucide-react";
import { inr, type Course } from "@/lib/courses";
import { useLang } from "@/lib/i18n";

const thumb = {
  primary: "from-navy to-royal",
  success: "from-navy to-success",
  gold: "from-navy to-gold",
};
const tagCls = {
  Bestseller: "bg-gold text-navy",
  New: "bg-success text-success-foreground",
  Hot: "bg-destructive text-destructive-foreground",
  Free: "bg-primary text-primary-foreground",
};

export function MiniChart() {
  const bars = [30, 45, 38, 55, 48, 62, 58, 72, 66, 80];
  return (
    <div className="mini-chart flex h-16 items-end gap-1.5" aria-hidden="true">
      {bars.map((h, i) => (
        <span key={i} className={`w-2 rounded-sm ${i % 3 === 1 ? "bg-destructive" : "bg-success"}`} style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function CourseCard({ course }: { course: Course }) {
  const { t, lang } = useLang();
  const off = course.mrp ? Math.round((1 - course.price / course.mrp) * 100) : 0;
  return (
    <article className="course-row course-motion group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-transform hover:-translate-y-1">
      <div className={`course-cover relative aspect-video w-full shrink-0 overflow-hidden bg-gradient-to-br ${thumb[course.hue]}`}>
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tagCls[course.tag]}`}>{course.tag}</span>
        <Link to="/courses/$courseId" params={{courseId:course.id}} aria-label={course.title[lang]} className="absolute inset-0"><img src={educator} alt="" width={1280} height={768} loading="lazy" /></Link>
      </div>
      <div className="course-body flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold leading-tight text-card-foreground">
          <Link to="/courses/$courseId" params={{ courseId: course.id }} className="transition-colors hover:text-primary hover:underline">{course.title[lang]}</Link>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{course.lessons} {t("lessons")} · {course.language}</p>
        <div className="mt-2 flex items-center gap-1 text-xs">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="font-semibold">{course.rating}</span>
          <span className="text-muted-foreground">({course.reviews})</span>
        </div>
        <div className="course-price mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-gold">{course.price ? inr(course.price) : "FREE"}</span>
            {course.mrp > 0 && <span className="text-xs text-muted-foreground line-through">{inr(course.mrp)}</span>}
            {off > 0 && <span className="text-xs font-semibold text-success">{off}% off</span>}
          </div>
        </div>
        <Link to="/courses/$courseId" params={{ courseId: course.id }} className="course-cta mt-3 block w-full rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90">{t("enroll")}</Link>
      </div>
    </article>
  );
}
