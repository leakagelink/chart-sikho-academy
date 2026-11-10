import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Crown, GitBranch, Network, RotateCcw, Search, UserRound, Users, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang, type DictKey } from '@/lib/i18n';
import { studentTreeView, teamTotals, type NetworkMember } from '@/lib/student-team-tree';

export function StudentTeamTree({ userId, name, code, members, earnings, income, available, currency }: { userId: string; name: string; code: string; members: NetworkMember[]; earnings: number; income: number; available: number; currency: string }) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [selected, setSelected] = useState<string>();
  const viewport = useRef<HTMLDivElement>(null);
  const money = (amount: number) => new Intl.NumberFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { style: 'currency', currency: currency === 'USD' ? 'USD' : 'INR', maximumFractionDigits: 0 }).format(amount);
  const date = (value: string) => new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN');
  const own: NetworkMember = { id: userId, referred_id: userId, referrer_id: null, level: 0, full_name: name, member_code: code, created_at: '' };
  const view = useMemo(() => studentTreeView(own, members, query, level), [members, query, level, userId, name, code]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = useMemo(() => teamTotals(members), [members]);
  const earnedOf = (m: NetworkMember) => m.level === 0 ? income : Number(m.earned ?? 0);
  const teamOf = (m: NetworkMember) => m.level === 0 ? members.length : totals.get(m.referred_id) ?? 0;
  const byId = new Map([own, ...members].map(m => [m.referred_id, m]));
  const chosen = selected ? byId.get(selected) : undefined;
  const directCount = members.filter(m => m.level === 1).length;
  const metrics: [DictKey, string | number, typeof Users, string][] = [
    ['tree_network', members.length + 1, Users, 'tree-stat-blue'],
    ['admin_total_members', members.length, Network, 'tree-stat-green'],
    ['admin_direct_members', directCount, GitBranch, 'tree-stat-rose'],
    ['wallet_total_earned', money(earnings), Wallet, 'tree-stat-navy'],
    ['wallet_available', money(available), Wallet, 'tree-stat-gold'],
  ];
  const label = (m: NetworkMember) => m.full_name?.trim() || m.member_code || '—';
  function branch(member: NetworkMember): React.ReactNode {
    const root = member.level === 0;
    const kids = view.children.get(member.referred_id) ?? [];
    return <li key={member.referred_id} className="team-tree-branch">
      <Button variant="ghost" className={`team-tree-member ${root ? 'tree-root-member' : ''} ${selected === member.referred_id ? 'tree-member-selected' : ''} ${view.matching.has(member.referred_id) ? '' : 'tree-member-context'}`} aria-label={`${t('tree_details')}: ${label(member)}`} aria-pressed={selected === member.referred_id} onClick={() => setSelected(member.referred_id)}>
        {root && <span className="tree-root-label"><Crown size={14}/>{t('admin_team_root')}</span>}
        <span className={`tree-avatar ${root ? 'tree-avatar-large' : ''}`}><span className="tree-avatar-image"><UserRound size={root ? 34 : 26}/></span></span>
        <span className="tree-node-copy"><span className="tree-node-name">{member.full_name?.trim() || '—'}</span><span className="tree-id-row"><span className="tree-member-id">{member.member_code || '—'}</span><span className="tree-level">L{member.level}</span></span></span>
        <span className="tree-node-footer"><span><Users size={15}/>{t('admin_total_members')}: <strong>{teamOf(member)}</strong></span><span className="tree-node-earn" title={t('wallet_total_earned')}><Wallet size={14}/>{money(earnedOf(member))}</span></span>
      </Button>
      {kids.length > 0 && <ul className="team-tree-children">{kids.map(branch)}</ul>}
    </li>;
  }
  const parent = chosen?.referrer_id ? byId.get(chosen.referrer_id) : undefined;
  const chosenDirect = chosen ? members.filter(m => m.referrer_id === chosen.referred_id).length : 0;
  return <section className="admin-team-tree mt-6">
    <header className="tree-toolbar"><h2 className="tree-title"><Network size={26}/><span>{t('tree_unilevel')}<small>{t('tree_network')}</small></span></h2><label className="tree-search"><Search size={18}/><input aria-label={t('affiliate_search')} placeholder={t('tree_search_members')} value={query} onChange={e => setQuery(e.target.value)}/></label></header>
    <div className="tree-summary">{metrics.map(([key, value, Icon, tone]) => <article key={key} className={`tree-stat ${tone}`}><Icon size={28}/><div><p>{t(key)}</p><strong>{value}</strong></div></article>)}</div>
    <div className="tree-filters"><select aria-label={t('admin_level')} value={level} onChange={e => setLevel(e.target.value)}><option value="all">{t('tree_all_levels')}</option>{view.levels.map(l => <option key={l} value={l}>{l === 0 ? t('admin_team_root') : `${t('admin_level')} ${l}`}</option>)}</select><div className="tree-canvas-controls"><span>{t('tree_levels')}: <strong>{view.levels.filter(l => l > 0).length}</strong></span><Button variant="outline" size="icon" aria-label={t('tree_reset_view')} title={t('tree_reset_view')} onClick={() => { setQuery(''); setLevel('all'); setSelected(undefined); viewport.current?.scrollTo({ left: 0, top: 0 }); }}><RotateCcw size={16}/></Button><Button variant="outline" size="icon" aria-label={t('tree_previous')} title={t('tree_previous')} onClick={() => viewport.current?.scrollBy({ left: -320, behavior: 'smooth' })}><ArrowLeft size={18}/></Button><Button variant="outline" size="icon" aria-label={t('tree_next')} title={t('tree_next')} onClick={() => viewport.current?.scrollBy({ left: 320, behavior: 'smooth' })}><ArrowRight size={18}/></Button></div></div>
    <div className={`tree-workspace ${chosen ? 'tree-with-inspector' : ''}`}><div ref={viewport} className="team-tree-viewport" tabIndex={0} role="region" aria-label={t('student_referral_tree')}>{view.matching.size ? <ul className="team-tree-roots">{branch(own)}</ul> : <p className="tree-empty">{t('admin_empty')}</p>}</div>
      {chosen && <aside className="tree-inspector" aria-label={t('tree_details')}><header className="tree-inspector-header"><Button variant="ghost" size="icon" className="tree-inspector-close" aria-label={t('admin_close_team')} title={t('admin_close_team')} onClick={() => setSelected(undefined)}><X size={21}/></Button><span className="tree-avatar tree-avatar-large"><span className="tree-avatar-image"><UserRound size={34}/></span></span><div className="min-w-0"><h3>{chosen.full_name?.trim() || '—'}</h3><p className="tree-inspector-id">{chosen.member_code || '—'}</p></div></header><dl className="tree-inspector-rows"><div><dt><UserRound size={18}/>{t('student_member_id')}</dt><dd>{chosen.member_code || '—'}</dd></div><div><dt><Network size={18}/>{t('admin_level')}</dt><dd>{chosen.level}</dd></div><div><dt><Users size={18}/>{t('admin_direct_members')}</dt><dd>{chosenDirect}</dd></div><div><dt><Network size={18}/>{t('admin_total_members')}</dt><dd>{teamOf(chosen)}</dd></div><div><dt><Wallet size={18}/>{t('wallet_total_earned')}</dt><dd>{money(earnedOf(chosen))}</dd></div>{chosen.created_at && <div><dt><CalendarDays size={18}/>{t('up_joined')}</dt><dd>{date(chosen.created_at)}</dd></div>}{parent && <div><dt><GitBranch size={18}/>{t('tree_parent')}</dt><dd>{label(parent)}</dd></div>}</dl><footer className="tree-inspector-actions"><Button variant="outline" onClick={() => setSelected(undefined)}><X size={16}/>{t('admin_close_team')}</Button></footer></aside>}
    </div>
  </section>;
}
