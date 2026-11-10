import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';

/**
 * Shared product detail page: header (title + cover), sticky purchase panel and body.
 * Mobile order: header → purchase → body. Desktop: two columns with the purchase panel pinned on the right.
 */
export function ProductDetailLayout({ back, header, aside, children }: { back: ReactNode; header: ReactNode; aside: ReactNode; children?: ReactNode }) {
  return <main className="product-detail mx-auto w-full min-w-0 max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
    {back}
    <div className="mt-4 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <header className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">{header}</header>
      <aside className="min-w-0 self-start rounded-xl border border-border bg-card p-4 shadow-card sm:p-5 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1">{aside}</aside>
      <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">{children}</div>
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
