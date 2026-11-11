import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';
import { useIsPhoneLayout } from '@/lib/native-app';

export type TreeCanvasHandle = {
  scrollTo: (options: ScrollToOptions) => void;
  scrollBy: (options: ScrollToOptions) => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

export const TreeCanvas = forwardRef<TreeCanvasHandle, { children: ReactNode; label: string }>(function TreeCanvas({ children, label }, ref) {
  const phone = useIsPhoneLayout();
  const viewport = useRef<HTMLDivElement>(null);
  const transform = useRef<ReactZoomPanPinchRef>(null);
  const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160;
  useImperativeHandle(ref, () => ({
    scrollTo: options => {
      if (phone) void transform.current?.resetTransform(duration());
      else viewport.current?.scrollTo(options);
    },
    scrollBy: options => {
      if (phone) void transform.current?.panBy(-(options.left ?? 0), -(options.top ?? 0), duration());
      else viewport.current?.scrollBy(options);
    },
    zoomIn: () => { void transform.current?.zoomIn(0.2, duration()); },
    zoomOut: () => { void transform.current?.zoomOut(0.2, duration()); },
  }), [phone]);
  return <div ref={viewport} className={`team-tree-viewport ${phone ? 'tree-zoom-viewport' : ''}`} tabIndex={0} role="region" aria-label={label}>
    {phone ? <TransformWrapper ref={transform} minScale={0.2} maxScale={2.5} initialScale={1} centerOnInit doubleClick={{ disabled: true }} panning={{ velocityDisabled: true }}>
      <TransformComponent wrapperClass="tree-zoom-wrapper" contentClass="tree-zoom-content">{children}</TransformComponent>
    </TransformWrapper> : children}
  </div>;
});

export function TreeZoomControls({ canvas }: { canvas: React.RefObject<TreeCanvasHandle | null> }) {
  const { t } = useLang();
  const phone = useIsPhoneLayout();
  if (!phone) return null;
  return <><Button variant="outline" size="icon" title={t('tree_zoom_out')} aria-label={t('tree_zoom_out')} onClick={() => canvas.current?.zoomOut()}><Minus size={18}/></Button><Button variant="outline" size="icon" title={t('tree_zoom_in')} aria-label={t('tree_zoom_in')} onClick={() => canvas.current?.zoomIn()}><Plus size={18}/></Button></>;
}