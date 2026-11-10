import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Crown, GitBranch, Network, RotateCcw, Search, UserRound, Users, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang, type DictKey } from '@/lib/i18n';

type Member = { id: string; referred_id: string; full_name: string | null; member_code: string | null; created_at: string };
export function StudentTeamTree({ userId, name, code, members, earnings, available, currency }: { userId: string; name: string; code: string; members: Member[]; earnings: number; available: number; currency: string }) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [selected, setSelected] = useState<string>();
  const viewport = useRef<HTMLDivElement>(null);
  const money = (amount: number) => new Intl.NumberFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { style: 'currency', currency: currency === 'USD' ? 'USD' : 'INR', maximumFractionDigits: 0 }).format(amount);
  const own = { id: userId, referred_id: userId, full_name: name, member_code: code, created_at: '' };
  const matches = (member: Member) => `${member.full_name ?? ''} ${member.member_code ?? ''} ${member.referred_id}`.toLowerCase().includes(query.trim().toLowerCase());
  const shown = level === '0' ? [] : members.filter(matches);
  const rootMatches = level !== '1' && matches(own);
  const chosen = selected === userId ? own : members.find(m => m.referred_id === selected);
  const metrics: [DictKey, string | number, typeof Users, string][] = [
    ['tree_network', members.length + 1, Users, 'tree-stat-blue'],
    ['admin_direct_members', members.length, GitBranch, 'tree-stat-green'],
    ['wallet_total_earned', money(earnings), Wallet, 'tree-stat-navy'],
    ['wallet_available', money(available), Wallet, 'tree-stat-gold'],
  ];
  function node(member: Member, root = false) {
    const displayName = member.full_name?.trim() || '—';
    return <Button variant="ghost" className={`team-tree-member ${root ? 'tree-root-member' : ''} ${selected === member.referred_id ? 'tree-member-selected' : ''} ${root && !rootMatches ? 'tree-member-context' : ''}`} aria-label={`${t('tree_details')}: ${displayName}`} aria-pressed={selected === member.referred_id} onClick={() => setSelected(member.referred_id)}>
      {root && <span className="tree-root-label"><Crown size={14}/>{t('admin_team_root')}</span>}
      <span className={`tree-avatar ${root ? 'tree-avatar-large' : ''}`}><span className="tree-avatar-image"><UserRound size={root ? 34 : 26}/></span></span>
      <span className="tree-node-copy"><span className="tree-node-name">{displayName}</span><span className="tree-member-id">{member.member_code || member.referred_id}</span></span>
      <span className="tree-node-footer"><span>{root ? <><Users size={15}/>{t('admin_direct_members')}: <strong>{members.length}</strong></> : <><CalendarDays size={15}/>{new Date(member.created_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</>}</span><span className="tree-level">L{root ? 0 : 1}</span></span>
    </Button>;
  }
  return <section className="admin-team-tree mt-6">
    <header className="tree-toolbar"><h2 className="tree-title"><Network size={26}/><span>{t('tree_unilevel')}<small>{t('tree_network')}</small></span></h2><label className="tree-search"><Search size={18}/><input aria-label={t('affiliate_search')} placeholder={t('tree_search_members')} value={query} onChange={e => setQuery(e.target.value)}/></label></header>
    <div className="tree-summary">{metrics.map(([label, value, Icon, tone]) => <article key={label} className={`tree-stat ${tone}`}><Icon size={28}/><div><p>{t(label)}</p><strong>{value}</strong></div></article>)}</div>
    <div className="tree-filters"><select aria-label={t('admin_level')} value={level} onChange={e => setLevel(e.target.value)}><option value="all">{t('tree_all_levels')}</option><option value="0">{t('admin_team_root')}</option><option value="1">{t('admin_level')} 1</option></select><div className="tree-canvas-controls"><Button variant="outline" size="icon" aria-label={t('tree_reset_view')} title={t('tree_reset_view')} onClick={() => { setQuery(''); setLevel('all'); setSelected(undefined); viewport.current?.scrollTo({ left: 0, top: 0 }); }}><RotateCcw size={16}/></Button><Button variant="outline" size="icon" aria-label={t('tree_previous')} title={t('tree_previous')} onClick={() => viewport.current?.scrollBy({ left: -320, behavior: 'smooth' })}><ArrowLeft size={18}/></Button><Button variant="outline" size="icon" aria-label={t('tree_next')} title={t('tree_next')} onClick={() => viewport.current?.scrollBy({ left: 320, behavior: 'smooth' })}><ArrowRight size={18}/></Button></div></div>
    <div className={`tree-workspace ${chosen ? 'tree-with-inspector' : ''}`}><div ref={viewport} className="team-tree-viewport" tabIndex={0} role="region" aria-label={t('student_referral_tree')}>{rootMatches || shown.length ? <ul className="team-tree-roots"><li className="team-tree-branch">{node(own, true)}{shown.length > 0 && <ul className="team-tree-children">{shown.map(member => <li key={member.id} className="team-tree-branch">{node(member)}</li>)}</ul>}</li></ul> : <p className="tree-empty">{t('admin_empty')}</p>}</div>
      {chosen && <aside className="tree-inspector" aria-label={t('tree_details')}><header className="tree-inspector-header"><Button variant="ghost" size="icon" className="tree-inspector-close" aria-label={t('admin_close_team')} title={t('admin_close_team')} onClick={() => setSelected(undefined)}><X size={21}/></Button><span className="tree-avatar tree-avatar-large"><span className="tree-avatar-image"><UserRound size={34}/></span></span><div className="min-w-0"><h3>{chosen.full_name?.trim() || '—'}</h3><p className="tree-inspector-id">{chosen.member_code || chosen.referred_id}</p></div></header><dl className="tree-inspector-rows"><div><dt><UserRound size={18}/>{t('student_member_id')}</dt><dd>{chosen.member_code || chosen.referred_id}</dd></div><div><dt><Network size={18}/>{t('admin_level')}</dt><dd>{chosen.referred_id === userId ? 0 : 1}</dd></div>{chosen.created_at && <div><dt><CalendarDays size={18}/>{t('up_joined')}</dt><dd>{new Date(chosen.created_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</dd></div>}{chosen.referred_id !== userId && <div><dt><GitBranch size={18}/>{t('tree_parent')}</dt><dd>{name}</dd></div>}</dl><footer className="tree-inspector-actions"><Button variant="outline" onClick={() => setSelected(undefined)}><X size={16}/>{t('admin_close_team')}</Button></footer></aside>}
    </div>
  </section>;
}