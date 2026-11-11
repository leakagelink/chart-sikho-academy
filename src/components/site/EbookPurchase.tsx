import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useLang } from '@/lib/i18n';
import { canOpenEbook } from '@/lib/ebook-access';
import { Button } from '@/components/ui/button';
import { ManualPay } from './ManualPay';
import { ProductSocial } from './ProductSocial';
import { inr } from '@/lib/courses';

/** eBook card footer: price with compact Like / Comment / Share, then the buy/open action (payment opens in a popup). */
export function EbookPurchase({ book }: { book: { id: string; title: string; price: number; has_file: boolean | null } }) {
  return <div className="ebook-foot mt-auto pt-3">
    <div className="ebook-price-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><p className="min-w-0 text-lg font-bold text-primary">{inr(Number(book.price))}</p><ProductSocial compact kind="ebook" id={book.id} title={book.title} className="-mr-2"/></div>
    <EbookPurchaseAction book={book}/>
  </div>;
}
function EbookPurchaseAction({ book }: { book: { id: string; title: string; price: number; has_file: boolean | null } }) {
  const { session } = useAuth();
  const user = session?.user;
  const { t } = useLang();
  const owned = useQuery({ queryKey: ['ebook-owned', user?.id, book.id], enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const r = await supabase.from('orders').select('id').eq('user_id', user.id).eq('ebook_id', book.id).eq('status', 'paid').limit(1);
      if (r.error) throw r.error;
      return !!r.data?.length;
    }, refetchInterval: 15000 });
  const download = useMutation({ mutationFn: async () => {
    const r = await supabase.rpc('my_ebook_resource', { _ebook_id: book.id });
    if (r.error) throw r.error;
    if (!r.data) throw new Error(t('ebook_file_missing'));
    const url = await supabase.storage.from('course-resources').createSignedUrl(r.data, 300);
    if (url.error || !url.data) throw new Error(t('admin_error'));
    return url.data.signedUrl;
  }, onSuccess: url => { window.location.assign(url); }, onError: e => toast.error(e.message) });
  if (!book.has_file) return <p role="status" className="mt-3 text-sm text-muted-foreground">{t('ebook_file_missing')}</p>;
  if (!user) return <Button asChild className="mt-3 w-full"><Link to="/auth" search={{ redirect: '/ebooks' }}>{t('ebook_signin')}</Link></Button>;
  if (owned.isPending) return <p className="mt-3 text-sm text-muted-foreground">{t('admin_loading')}</p>;
  if (owned.isError) return <p role="alert" className="text-sm text-destructive">{t('admin_error')}</p>;
  if (canOpenEbook(book.price, owned.data ?? false)) return <Button className="mt-3 w-full" disabled={download.isPending} onClick={() => download.mutate()}><Download className="h-4 w-4" />{t('ebook_open')}</Button>;
  return <div className="mt-3"><ManualPay course={book} userId={user.id} productType="ebook" className="w-full" /></div>;
}