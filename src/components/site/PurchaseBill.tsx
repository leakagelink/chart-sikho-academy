import { useRef, useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLang } from '@/lib/i18n';
import type { Database } from '@/integrations/supabase/types';

type Invoice = Database['public']['Tables']['invoices']['Row'];
export function PurchaseBill({ invoice }: { invoice: Invoice }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const snapshot = invoice.billing_snapshot && typeof invoice.billing_snapshot === 'object' && !Array.isArray(invoice.billing_snapshot) ? invoice.billing_snapshot : {};
  const text = (key: string) => String(snapshot[key] ?? '');
  const total = Number(snapshot['total'] ?? invoice.total);
  const subtotal = Number(snapshot['subtotal'] ?? invoice.subtotal);
  const tax = Number(snapshot['gst_amount'] ?? invoice.gst_amount);
  const rate = Number(snapshot['gst_rate'] ?? invoice.gst_rate);
  const isGst = Boolean(text('seller_gstin')) && rate > 0;
  const money = (n: number) => new Intl.NumberFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);
  function print() {
    if (!content.current) return;
    const frame = document.createElement('iframe');
    frame.hidden = true;
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc) { frame.remove(); return; }
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
    doc.close();
    doc.title = invoice.invoice_no;
    document.querySelectorAll('style,link[rel="stylesheet"]').forEach(node => doc.head.appendChild(node.cloneNode(true)));
    doc.body.className = 'bg-background text-foreground';
    const copy = content.current.cloneNode(true);
    doc.body.appendChild(copy);
    const win = frame.contentWindow;
    if (!win) { frame.remove(); return; }
    win.addEventListener('afterprint', () => frame.remove(), { once: true });
    setTimeout(() => { win.focus(); win.print(); }, 500);
  }
  return <>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}><FileText size={15} />{t(isGst ? 'billing_invoice' : 'billing_bill')}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{t(isGst ? 'billing_invoice' : 'billing_bill')}</DialogTitle></DialogHeader>
      <div ref={content} className="space-y-5 p-4 text-sm">
        <header className="border-b border-border pb-4"><h2 className="font-display text-2xl font-bold">{text('seller_name') || 'ChartSikho'}</h2><p className="whitespace-pre-line">{text('seller_address')}</p><p>{text('seller_state')}</p>{isGst && <p>{t('billing_gstin')}: {text('seller_gstin')}</p>}<p className="mt-3 font-semibold">{t(isGst ? 'billing_invoice' : 'billing_bill')} · {invoice.invoice_no}</p><p>{t('admin_date')}: {new Date(invoice.issued_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</p><p>{t('status')}: {t(invoice.status === 'cancelled' ? 'admin_cancelled' : 'paid')}</p></header>
        <section><h3 className="font-semibold">{t('admin_buyer_name')}</h3><p>{invoice.buyer_name}</p><p className="whitespace-pre-line">{text('buyer_address')} {text('buyer_state')}</p><p>{text('buyer_phone')}</p>{invoice.buyer_gstin && <p>{t('admin_buyer_gstin')}: {invoice.buyer_gstin}</p>}</section>
        <section className="border-y border-border py-4"><h3 className="font-semibold">{t('admin_title')}</h3><p className="break-words">{text('product_title') || invoice.order_id}</p>{isGst && <p>{t('billing_sac')}: {text('sac_code')}</p>}<p className="mt-2 break-all text-xs text-muted-foreground">{t('wallet_reference')}: {text('payment_reference')}</p></section>
        <dl className="space-y-2"><div className="flex justify-between gap-4"><dt>{t('admin_subtotal')}</dt><dd>{money(subtotal)}</dd></div>{isGst && (text('tax_type') === 'CGST_SGST' ? <><div className="flex justify-between gap-4"><dt>CGST ({rate / 2}%)</dt><dd>{money(Math.round(tax * 50) / 100)}</dd></div><div className="flex justify-between gap-4"><dt>SGST ({rate / 2}%)</dt><dd>{money(tax - Math.round(tax * 50) / 100)}</dd></div></> : <div className="flex justify-between gap-4"><dt>{text('tax_type') === 'IGST' ? 'IGST' : 'GST'} ({rate}%)</dt><dd>{money(tax)}</dd></div>)}<div className="flex justify-between gap-4 border-t border-border pt-3 text-lg font-bold"><dt>{t('admin_total')}</dt><dd>{money(total)}</dd></div></dl>
        <p className="text-xs text-muted-foreground">{t(isGst ? 'billing_tax_included' : 'billing_no_tax')}</p><p className="text-xs text-muted-foreground">{t('disclaimer')}</p>
      </div>
      <Button onClick={print}><Printer size={16} />{t('billing_print')}</Button>
    </DialogContent></Dialog>
  </>;
}