import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ebookLibraryQuery } from '@/lib/ebook-library';
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
  const library = useQuery(ebookLibraryQuery(user?.id));
  if (!book.has_file) return <p role="status" className="mt-3 text-sm text-muted-foreground">{t('ebook_file_missing')}</p>;
  if (!user) return <Button asChild className="mt-3 w-full"><Link to="/auth" search={{ redirect: '/ebooks' }}>{t('ebook_signin')}</Link></Button>;
  if (library.isPending) return <p className="mt-3 text-sm text-muted-foreground">{t('admin_loading')}</p>;
  if (library.isError) return <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => library.refetch()}>{t('ebook_retry')}</Button>;
  if (canOpenEbook(Number(book.price), library.data.some(b => b.id === book.id))) return <Button asChild className="mt-3 w-full"><Link to="/read/$ebookId" params={{ ebookId: book.id }}><BookOpen className="h-4 w-4" />{t('ebook_open')}</Link></Button>;
  return <div className="mt-3"><ManualPay course={book} userId={user.id} productType="ebook" className="w-full" /></div>;
}
