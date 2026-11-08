import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { adminNav } from '@/lib/admin-nav';
import { canAccess, type PanelAccess } from '@/lib/admin-permissions';
import type { AdminSection } from '@/lib/admin-rules';
import { useLang, type DictKey } from '@/lib/i18n';

export function AdminNavigation({section, access}: {section: AdminSection; access: PanelAccess}) {
  const {t} = useLang();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const groups = adminNav.map(g => ({...g, items: g.items.filter(it => 'section' in it && canAccess(access, it.section) && t(`admin_${it.section}_real` as DictKey).toLowerCase().includes(search.toLowerCase()))})).filter(g => g.items.length);
  const navigation = <>
    <label className="admin-nav-search relative block">
      <Search size={17} className="pointer-events-none absolute left-3 top-3 text-muted-foreground"/>
      <input aria-label={t('admin_find_section')} placeholder={t('admin_find_section')} value={search} onChange={e=>setSearch(e.target.value)} className="h-11 w-full min-w-0 rounded-md border border-sidebar-border bg-sidebar-accent/40 pl-10 pr-3 text-sm text-sidebar-foreground outline-none focus:border-sidebar-ring"/>
    </label>
    <nav aria-label={t('admin_navigation')} className="admin-nav-list mt-5 space-y-5">
      {groups.map(g=><div key={g.group}><p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">{t(g.group)}</p><div className="space-y-1">{g.items.map(it=> {
        if (!('section' in it)) return null;
        return <Button key={it.section} asChild variant="ghost" className={`admin-nav-link h-auto min-h-11 w-full justify-start px-3 py-2.5 text-sm ${section===it.section?'admin-nav-active bg-sidebar-accent font-semibold text-sidebar-primary':'text-sidebar-foreground'}`}>
          <Link aria-current={section===it.section?'page':undefined} to="/admin/$section" params={{section:it.section}} search={{q:'',status:'all',cat:'all',when:'all',rank:'all',state:'all',city:'all'}} onClick={()=>setOpen(false)}><span className="min-w-0 flex-1 whitespace-normal text-left">{t(`admin_${it.section}_real` as DictKey)}</span>{section===it.section&&<ChevronRight size={16} className="shrink-0"/>}</Link>
        </Button>;
      })}</div></div>)}
      {!groups.length&&<p className="px-3 text-sm text-muted-foreground">{t('admin_empty')}</p>}
    </nav>
  </>;
  return <>
    <aside className="admin-sidebar hidden min-w-0 bg-sidebar text-sidebar-foreground lg:block">
      <div className="admin-sidebar-heading mb-5 flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-sidebar-border bg-sidebar-accent"><ShieldCheck size={22} className="text-sidebar-primary"/></span><span className="min-w-0 font-display text-lg font-bold">{t('real_admin')}</span></div>
      {navigation}
    </aside>
    <div className="admin-mobile-navigation lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button variant="outline" size="icon" aria-label={t('admin_open_menu')} title={t('admin_open_menu')}><Menu size={21}/></Button></SheetTrigger>
        <SheetContent side="left" className="admin-navigation-drawer flex w-[min(350px,92vw)] flex-col bg-sidebar p-5 text-sidebar-foreground [&>button]:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><SheetTitle className="flex min-w-0 items-center gap-2 font-display text-lg"><ShieldCheck size={21} className="shrink-0 text-sidebar-primary"/>{t('real_admin')}</SheetTitle><SheetClose asChild><Button variant="ghost" size="icon" aria-label={t('admin_cancel')}><X size={21}/></Button></SheetClose></div>
          <SheetDescription className="sr-only">{t('admin_navigation')}</SheetDescription>
          <div className="min-h-0 flex-1 overflow-y-auto pb-6">{navigation}</div>
        </SheetContent>
      </Sheet>
    </div>
  </>;
}