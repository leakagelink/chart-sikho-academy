import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';

/**
 * Shared product detail page: header (title + cover), sticky purchase panel and body.
 * Mobile order: header → purchase → body. Desktop: two columns with the purchase panel pinned on the right.
 */
export function ProductDetailLayout({ back, header, aside, children, asideClassName = '' }: { back: ReactNode; header: ReactNode; aside: ReactNode; children?: ReactNode; asideClassName?: string }) {
  return <main className="product-detail mx-auto w-full min-w-0 max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
    {back}
    <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <header className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-1">{header}</header>
      <aside className={`min-w-0 self-start rounded-xl border border-border bg-card p-4 shadow-card sm:p-5 xl:sticky xl:top-20 xl:col-start-2 xl:row-span-2 xl:row-start-1 ${asideClassName}`}>{aside}</aside>
      <div className="min-w-0 space-y-6 xl:col-start-1 xl:row-start-2">{children}</div>
    </div>
  </main>;
}

export function DetailBackLink({ to, label }: { to: '/courses' | '/live-classes' | '/webinars' | '/seminars'; label: string }) {
  return <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><ChevronLeft className="h-4 w-4" />{label}</Link>;
}

export function DetailCover({ src, alt, fallback }: { src?: string | null | undefined; alt: string; fallback: ReactNode }) {
  return <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
    {src ? <img src={src} alt={alt} decoding="async" className="block h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-muted-foreground">{fallback}</div>}
  </div>;
}

/** Light formatting for admin-written descriptions: "# heading" lines and **bold** text; everything else stays plain text. */
export function DetailDescription({ text }: { text: string }) {
  return <div className="space-y-2 break-words text-sm leading-relaxed text-muted-foreground">
    {text.split(/\r?\n/).map((raw, i) => {
      const line = raw.trim();
      if (!line) return null;
      const heading = /^#{1,6}\s+/.test(line);
      const body = line.replace(/^#{1,6}\s+/, '').split(/(\*\*[^*]+\*\*)/g).map((part, j) => /^\*\*[^*]+\*\*$/.test(part) ? <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong> : part);
      return heading ? <h2 key={i} className="pt-1 font-display text-lg font-bold text-foreground">{body}</h2> : <p key={i}>{body}</p>;
    })}
  </div>;
}
