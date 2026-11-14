import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Minus, Plus } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

/** In-app PDF reader (pdf.js on canvas) so eBooks open inside the website and the Android app, page by page. */
export function EbookReader({ url }: { url: string }) {
  const { t } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState(1.414);

  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    setDoc(null); setFailed(false);
    (async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const worker = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
      pdfjs.GlobalWorkerOptions.workerSrc = worker;
      const loading = pdfjs.getDocument({ url, rangeChunkSize: 262144, disableAutoFetch: true });
      task = loading;
      const d = await loading.promise;
      const first = await d.getPage(1);
      const vp = first.getViewport({ scale: 1 });
      if (cancelled) return;
      setRatio(vp.height / vp.width);
      setDoc(d);
    })().catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; void task?.destroy(); };
  }, [url]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e?.contentRect.width ?? 0)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageWidth = Math.max(200, Math.round(Math.min(width, 900) * zoom));
  return <div className="min-w-0">
    <div className="sticky top-16 z-10 mb-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 backdrop-blur">
      <p className="text-sm text-muted-foreground">{doc ? `${doc.numPages} ${t('ebook_pages')}` : t('ebook_loading')}</p>
      <div className="flex items-center gap-1">
        <Button type="button" size="icon" variant="outline" aria-label={t('tree_zoom_out')} disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))}><Minus className="h-4 w-4" /></Button>
        <span className="w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button type="button" size="icon" variant="outline" aria-label={t('tree_zoom_in')} disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
    <div ref={box} className="w-full overflow-x-auto">
      {failed && <p role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{t('ebook_load_failed')}</p>}
      {!failed && !doc && <div className="grid h-64 place-items-center rounded-lg bg-muted text-sm text-muted-foreground">{t('ebook_loading')}</div>}
      {doc && width > 0 && <div className="mx-auto flex flex-col items-center gap-3 pb-24" style={{ width: pageWidth }}>
        {Array.from({ length: doc.numPages }, (_, i) => <PdfPage key={i} doc={doc} n={i + 1} width={pageWidth} ratio={ratio} />)}
      </div>}
    </div>
  </div>;
}

function PdfPage({ doc, n, width, ratio }: { doc: PDFDocumentProxy; n: number; width: number; ratio: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(n <= 2);
  const [height, setHeight] = useState(Math.round(width * ratio));

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(!!e?.isIntersecting), { rootMargin: '1500px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    if (!near) { c.width = 0; c.height = 0; return; }
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    (async () => {
      const page = await doc.getPage(n);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = page.getViewport({ scale: scale * dpr });
      const ctx = c.getContext('2d');
      if (!ctx) return;
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      setHeight(Math.round(base.height * scale));
      const r = page.render({ canvas: c, canvasContext: ctx, viewport: vp });
      task = r;
      await r.promise;
    })().catch(() => undefined);
    return () => { cancelled = true; task?.cancel(); };
  }, [doc, n, width, near]);

  return <div ref={wrap} className="relative overflow-hidden rounded bg-background shadow-card" style={{ width, height }}>
    <canvas ref={canvas} className="block h-full w-full" aria-label={`Page ${n}`} />
  </div>;
}
