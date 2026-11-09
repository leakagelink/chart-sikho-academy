import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';

export function HomeProductShelf({ title, seeAll, children, ebooks = false }: { title: string; seeAll: ReactNode; children: ReactNode; ebooks?: boolean }) {
  const { t } = useLang();
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const update = () => setEdges({ left: node.scrollLeft > 2, right: node.scrollLeft + node.clientWidth < node.scrollWidth - 2 });
    const resize = new ResizeObserver(update);
    const mutation = new MutationObserver(update);
    resize.observe(node);
    mutation.observe(node, { childList: true, subtree: true });
    node.addEventListener('scroll', update, { passive: true });
    update();
    return () => { resize.disconnect(); mutation.disconnect(); node.removeEventListener('scroll', update); };
  }, []);
  const scroll = (direction: number) => {
    const node = rail.current;
    if (!node) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollBy({ left: direction * node.clientWidth, behavior: reduced ? 'instant' : 'smooth' });
  };
  return <section className={`home-product-shelf mt-10 ${ebooks ? 'home-ebooks' : ''}`}>
    <div className="home-section-heading grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="min-w-0 font-display text-2xl font-bold text-foreground">{title}</h2>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="icon" disabled={!edges.left} onClick={() => scroll(-1)} aria-label={`${title}: ${t('shelf_previous')}`} title={t('shelf_previous')}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" disabled={!edges.right} onClick={() => scroll(1)} aria-label={`${title}: ${t('shelf_next')}`} title={t('shelf_next')}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        {seeAll}
      </div>
    </div>
    <div ref={rail} className={`home-product-rail mt-4 ${ebooks ? 'home-product-rail-ebooks' : ''}`}>{children}</div>
  </section>;
}