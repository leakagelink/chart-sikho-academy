import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';
import { paymentConfigured, paymentUpiLink, qrUploadAllowed, type PaymentUpi } from '@/lib/payment-upi';

const paymentUpiQuery = { queryKey: ['payment-upi'], queryFn: async () => { const r = await supabase.rpc('payment_upi'); if (r.error) throw r.error; return r.data as PaymentUpi | null; } };

/** Uploaded QR (signed URL from private bucket) wins; otherwise generate from the UPI deep link. */
function usePaymentQr(upi: PaymentUpi | null | undefined, link: string) {
  const [qr, setQr] = useState('');
  useEffect(() => {
    let active = true;
    setQr('');
    if (upi?.qr_path) supabase.storage.from('payment-qr').createSignedUrl(upi.qr_path, 3600).then(r => { if (active) setQr(r.data?.signedUrl ?? ''); });
    else if (link) QRCode.toDataURL(link, { width: 240, margin: 1 }).then(url => { if (active) setQr(url); }).catch(() => {});
    return () => { active = false; };
  }, [upi?.qr_path, link]);
  return qr;
}

const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

type PayProduct = 'course' | 'ebook' | 'session' | 'plan';
type PayItem = { id: string; title: string; price: number };

function useLastPayment(userId: string, productType: PayProduct, id: string) {
  return useQuery({ queryKey: ['manual-pay', userId, productType, id], refetchInterval: 15000, queryFn: async () => { const r = await supabase.from('manual_payments').select('status,utr,admin_note,created_at').eq('user_id', userId).eq(productType === 'plan' ? 'plan_id' : productType === 'session' ? 'session_id' : productType === 'ebook' ? 'ebook_id' : 'course_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(); if (r.error) throw r.error; return r.data; } });
}

/** Shared purchase popup: responsive, scrollable, closable by X, Close button, Escape or backdrop. */
export function PaymentDialog({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title?: string; description: string; children: ReactNode }) {
  const { t } = useLang();
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md gap-3 overflow-y-auto rounded-xl p-4 sm:p-6">
      <DialogHeader className="pr-6 text-left"><DialogTitle className="font-display text-xl">{title ?? t('pay_upi_title')}</DialogTitle><DialogDescription className="break-words">{description}</DialogDescription></DialogHeader>
      {children}
      <DialogClose asChild><Button type="button" variant="outline" className="w-full">{t('pay_close')}</Button></DialogClose>
    </DialogContent>
  </Dialog>;
}

/** Popup body: pay by UPI QR, then submit UTR + screenshot for admin verification. */
export function ManualPayForm({ course, userId, productType = 'course', onDone }: { course: PayItem; userId: string; productType?: PayProduct; onDone?: (() => void) | undefined }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const [utr, setUtr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const upi = useQuery(paymentUpiQuery);
  const mine = useLastPayment(userId, productType, course.id);
  const link = paymentUpiLink(upi.data, course);
  const qr = usePaymentQr(upi.data, link);
  const submit = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error(t('pay_need_shot'));
      if (!/^image\/(png|jpe?g|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) throw new Error(t('pay_bad_shot'));
      if (!/^[A-Za-z0-9]{6,30}$/.test(utr.trim())) throw new Error(t('pay_bad_utr'));
      const path = `${userId}/${crypto.randomUUID()}.${file.name.split('.').pop() ?? 'jpg'}`;
      const up = await supabase.storage.from('payment-proofs').upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const r = productType === 'plan'
        ? await supabase.rpc('submit_plan_payment', { _plan_id: course.id, _utr: utr.trim(), _screenshot_path: path })
        : productType === 'session'
        ? await supabase.rpc('submit_session_payment', { _session_id: course.id, _utr: utr.trim(), _screenshot_path: path })
        : productType === 'ebook'
        ? await supabase.rpc('submit_ebook_payment', { _ebook_id: course.id, _utr: utr.trim(), _screenshot_path: path })
        : await supabase.rpc('submit_manual_payment', { _course_id: course.id, _utr: utr.trim(), _screenshot_path: path });
      if (r.error) throw new Error(r.error.message.includes('UTR already') ? t('pay_utr_used') : r.error.message.includes('pending') ? t('pay_pending') : t('admin_error'));
    },
    onSuccess: () => { toast.success(t('pay_submitted')); setUtr(''); setFile(null); qc.invalidateQueries({ queryKey: ['manual-pay'] }); qc.invalidateQueries({ queryKey: ['my-membership'] }); onDone?.(); },
    onError: e => toast.error((e as Error).message),
  });
  const last = mine.data;
  if (mine.isPending || upi.isPending) return <p className="text-sm text-muted-foreground">{t('admin_loading')}</p>;
  if (last?.status === 'pending') return <p className="rounded-md border border-border bg-muted/40 p-3 text-sm">{t('pay_pending')} (UTR {last.utr})</p>;
  if (!paymentConfigured(upi.data)) return <p className="text-sm text-muted-foreground">{t('pay_no_upi')}</p>;
  return <form onSubmit={(e: FormEvent) => { e.preventDefault(); submit.mutate(); }} className="min-w-0 space-y-3">
    {last?.status === 'rejected' && <p className="text-sm text-destructive">{t('pay_rejected')}{last.admin_note ? ` — ${last.admin_note}` : ''}</p>}
    <p className="text-sm">{t('pay_step1')} <b className="text-primary">₹{course.price}</b></p>
    {qr && <img src={qr} alt={t('pay_qr_preview')} className="mx-auto aspect-square w-full max-w-[13rem] rounded bg-background p-2 sm:max-w-[14rem]" />}
    {upi.data?.upi_id && <p className="break-all text-center text-sm">UPI ID: <b className="select-all">{upi.data.upi_id}</b></p>}
    {link && <a href={link} className="block text-center text-sm text-primary underline sm:hidden">{t('pay_open_app')}</a>}
    <label className="block text-sm">{t('pay_utr')}<input required value={utr} onChange={e => setUtr(e.target.value)} maxLength={30} className={inputCls} placeholder="e.g. 412345678901" /></label>
    <label className="block text-sm">{t('pay_shot')}<input required type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setFile(e.target.files?.[0] ?? null)} className={inputCls} /></label>
    <Button type="submit" className="w-full" disabled={submit.isPending}>{t('pay_submit')}</Button>
  </form>;
}

/** Student trigger: a Buy button that opens the payment popup; shows pending status once submitted. */
export function ManualPay({ course, userId, productType = 'course', label, className = '' }: { course: PayItem; userId: string; productType?: PayProduct; label?: string; className?: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const last = useLastPayment(userId, productType, course.id).data;
  if (last?.status === 'pending' && !open) return <p className="rounded-md border border-border bg-muted/40 p-3 text-sm">{t('pay_pending')} (UTR {last.utr})</p>;
  return <div className="space-y-2">
    {last?.status === 'rejected' && <p className="text-sm text-destructive">{t('pay_rejected')}{last.admin_note ? ` — ${last.admin_note}` : ''}</p>}
    <Button size="lg" className={productType === 'plan' ? `w-full ${className}` : className} onClick={() => setOpen(true)}>{label ?? t(productType === 'plan' ? 'choose_plan' : 'buy_now')}</Button>
    <PaymentDialog open={open} onOpenChange={setOpen} description={course.title}>{open && <ManualPayForm course={course} userId={userId} productType={productType} onDone={() => setOpen(false)} />}</PaymentDialog>
  </div>;
}

type Row = { id: string; user_id: string; course_id: string | null; ebook_id: string | null; product_title: string; amount: number; utr: string; screenshot_path: string; status: string; admin_note: string; created_at: string };

/** Admin: UPI settings + review queue for manual payments. */
export function ManualPayments({ canEdit, users, courses }: { canEdit: boolean; users: { id: string; full_name: string | null; phone: string | null }[]; courses: { id: string; title: string }[] }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [upiId, setUpiId] = useState('');
  const [payee, setPayee] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [removeQr, setRemoveQr] = useState(false);
  const upi = useQuery(paymentUpiQuery);
  useEffect(() => { if (upi.data) { setUpiId(upi.data.upi_id ?? ''); setPayee(upi.data.payee ?? ''); } }, [upi.data]);
  const savedLink = paymentUpiLink(upi.data);
  const qr = usePaymentQr(upi.data, savedLink);
  const list = useQuery({ queryKey: ['manual-payments-admin'], queryFn: async () => { const r = await supabase.from('manual_payments').select('*').order('created_at', { ascending: false }).limit(500); if (r.error) throw r.error; return r.data as Row[]; } });
  const saveUpi = useMutation({
    mutationFn: async () => {
      const id = upiId.trim();
      if (id && !/^[A-Za-z0-9._-]{2,64}@[A-Za-z0-9.-]{2,64}$/.test(id)) throw new Error(t('pay_bad_upi'));
      let qrPath = removeQr ? '' : (upi.data?.qr_path ?? '');
      if (qrFile) {
        if (!qrUploadAllowed(qrFile)) throw new Error(t('pay_qr_bad'));
        const ext = qrFile.type === 'image/png' ? 'png' : qrFile.type === 'image/webp' ? 'webp' : 'jpg';
        qrPath = `qr/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from('payment-qr').upload(qrPath, qrFile, { contentType: qrFile.type });
        if (up.error) throw new Error(t('admin_error'));
      }
      if (!id && !qrPath) throw new Error(t('pay_need_upi_or_qr'));
      const r = await supabase.rpc('set_upi_settings', { _upi_id: id, _payee: payee, _qr_path: qrPath });
      if (r.error) throw new Error(r.error.message.includes('Forbidden') ? t('pay_forbidden') : r.error.message.includes('UPI') ? t('pay_bad_upi') : t('admin_error'));
      const old = upi.data?.qr_path;
      if (old && old !== qrPath) await supabase.storage.from('payment-qr').remove([old]);
    },
    onSuccess: () => { toast.success(t('pay_saved')); setQrFile(null); setRemoveQr(false); qc.invalidateQueries({ queryKey: ['payment-upi'] }); },
    onError: e => toast.error((e as Error).message),
  });
  const review = useMutation({ mutationFn: async (v: { id: string; approve: boolean; note: string }) => { const r = await supabase.rpc('review_manual_payment', { _id: v.id, _approve: v.approve, _note: v.note }); if (r.error) throw r.error; }, onSuccess: () => { toast.success(t('pay_saved')); qc.invalidateQueries(); }, onError: () => toast.error(t('admin_error')) });
  async function viewShot(path: string) { const r = await supabase.storage.from('payment-proofs').createSignedUrl(path, 300); if (r.data) window.open(r.data.signedUrl, '_blank', 'noopener'); }
  const rows = (list.data ?? []).filter(r => filter === 'all' || r.status === filter);
  const u = (id: string) => users.find(x => x.id === id);
  return <div className="space-y-6">
    <section className="border-y border-border py-5">
      <h2 className="mb-4 font-display text-xl font-bold">{t('pay_settings_title')}</h2>
      {upi.isError && <p role="alert" className="mb-3 text-destructive">{t('admin_error')}</p>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
        {canEdit ? <form onSubmit={e => { e.preventDefault(); saveUpi.mutate(); }} className="max-w-lg space-y-4">
          <label className="block text-sm">{t('pay_admin_upi')}<input maxLength={129} value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@bank" className={inputCls} /></label>
          <label className="block text-sm">{t('pay_admin_payee')}<input maxLength={80} value={payee} onChange={e => setPayee(e.target.value)} className={inputCls} /></label>
          <label className="block text-sm">{t('pay_qr_upload')}<input key={qrFile ? 'f' : 'e'} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { setQrFile(e.target.files?.[0] ?? null); setRemoveQr(false); }} className={inputCls} /><span className="mt-1 block text-xs text-muted-foreground">{t('pay_qr_hint')}</span></label>
          {upi.data?.qr_path && !qrFile && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={removeQr} onChange={e => setRemoveQr(e.target.checked)} />{t('pay_qr_remove')}</label>}
          <Button type="submit" disabled={saveUpi.isPending || upi.isPending}>{t('pay_save')}</Button>
        </form> : <div><p className="break-all text-sm">{upi.data?.upi_id || t('pay_no_upi')}</p><p className="text-sm text-muted-foreground">{upi.data?.payee}</p></div>}
        <figure className="min-w-0 text-center">
          {qr ? <img src={qr} alt={t('pay_qr_preview')} className="mx-auto h-56 w-56 max-w-full rounded bg-background p-2" /> : <p className="py-6 text-sm text-muted-foreground">{t('pay_qr_none')}</p>}
          <figcaption className="mt-2 break-all text-sm">{t('pay_qr_preview')}{upi.data?.upi_id && <b className="mt-1 block select-all">{upi.data.upi_id}</b>}</figcaption>
        </figure>
      </div>
    </section>
    <h2 className="font-display text-xl font-bold">{t('pay_review_title')}</h2>
    <select aria-label={t('status')} value={filter} onChange={e => setFilter(e.target.value)} className={`${inputCls} w-auto`}>
      {['pending', 'approved', 'rejected', 'all'].map(s => <option key={s} value={s}>{t(s === 'all' ? 'filter_all' : `pay_st_${s}` as 'pay_st_pending')}</option>)}
    </select>
    <div className="overflow-x-auto border-y border-border"><table className="admin-record-table w-full text-left text-sm"><thead className="bg-muted/40"><tr>{['pay_col_user', 'pay_col_phone', 'pay_col_product', 'pay_col_amount', 'pay_utr', 'status', 'pay_col_date', 'admin_action'].map(k => <th key={k} className="whitespace-nowrap px-3 py-3 text-muted-foreground">{t(k as 'status')}</th>)}</tr></thead>
      <tbody>{rows.map(r => <tr key={r.id} className="border-t border-border">
        <td data-label={t('pay_col_user')} className="px-3 py-3">{u(r.user_id)?.full_name ?? r.user_id.slice(0, 8)}</td><td data-label={t('pay_col_phone')} className="px-3 py-3">{u(r.user_id)?.phone ?? '—'}</td>
        <td data-label={t('pay_col_product')} className="px-3 py-3">{r.product_title || courses.find(c => c.id === r.course_id)?.title || '—'}{r.ebook_id && <span className="block text-xs text-muted-foreground">{t('nav_ebooks')}</span>}</td><td data-label={t('pay_col_amount')} className="px-3 py-3">₹{r.amount}</td>
        <td data-label={t('pay_utr')} className="px-3 py-3 font-mono">{r.utr}</td><td data-label={t('status')} className="px-3 py-3">{t(`pay_st_${r.status}` as 'pay_st_pending')}{r.admin_note ? ` — ${r.admin_note}` : ''}</td>
        <td data-label={t('pay_col_date')} className="px-3 py-3">{new Date(r.created_at).toLocaleString()}</td>
        <td data-label={t('admin_action')} className="px-3 py-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => viewShot(r.screenshot_path)}>{t('pay_view_shot')}</Button>
          {canEdit && r.status === 'pending' && <><Button size="sm" disabled={review.isPending} onClick={() => confirm(t('pay_confirm_q')) && review.mutate({ id: r.id, approve: true, note: '' })}>{t('pay_confirm')}</Button>
            <Button size="sm" variant="outline" className="text-destructive" disabled={review.isPending} onClick={() => { const note = prompt(t('pay_reject_reason')); if (note !== null) review.mutate({ id: r.id, approve: false, note }); }}>{t('admin_reject')}</Button></>}</div></td>
      </tr>)}{!rows.length && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">{t('admin_empty')}</td></tr>}</tbody></table></div>
  </div>;
}
