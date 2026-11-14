import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { EbookReader } from '@/components/site/EbookReader';
import { ebookFileQuery, ebookLibraryQuery } from '@/lib/ebook-library';
import { pageMeta } from '@/lib/route-meta';

export const Route = createFileRoute('/_authenticated/read/$ebookId')({
  head: () => pageMeta('Read eBook', 'Read your Chartसीखो eBook inside the app.'),
  component: ReadEbook,
});

function ReadEbook() {
  const { ebookId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const { t } = useLang();
  const library = useQuery(ebookLibraryQuery(user.id));
  const file = useQuery(ebookFileQuery(ebookId));
  const book = library.data?.find(b => b.id === ebookId);
  const err = file.error?.message;
  return <section className="w-full px-3 pt-4 sm:px-4 sm:pt-6">
    <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <Link to="/ebooks" aria-label={t('nav_ebooks')} className="grid size-10 place-items-center rounded-xl border border-border text-gold"><ArrowLeft className="size-5" /></Link>
      <h1 className="truncate font-display text-xl font-bold sm:text-2xl">{book?.title ?? t('nav_ebooks')}</h1>
      {file.data ? <Button asChild size="sm" variant="outline"><a href={file.data.downloadUrl} download><Download className="h-4 w-4" /><span className="hidden min-[380px]:inline">{t('ebook_download')}</span></a></Button> : <span />}
    </div>
    {file.isPending && <div className="grid h-64 place-items-center rounded-lg bg-muted text-sm text-muted-foreground">{t('ebook_loading')}</div>}
    {file.isError && <div role="alert" className="rounded-lg border border-border bg-card p-5 text-sm">
      <p>{err === 'no-access' ? t('ebook_no_access') : err === 'missing' ? t('ebook_file_missing') : t('ebook_load_failed')}</p>
      <Button asChild className="mt-4"><Link to="/ebooks">{t('nav_ebooks')}</Link></Button>
    </div>}
    {file.data && <EbookReader url={file.data.readUrl} />}
  </section>;
}
