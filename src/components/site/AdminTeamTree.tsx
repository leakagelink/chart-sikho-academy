import {useMemo,useRef,useState} from 'react';
import {Link} from '@tanstack/react-router';
import {ArrowLeft,ArrowRight,CalendarDays,CheckCircle2,Crown,Eye,GitBranch,Mail,MapPin,Network,Phone,RotateCcw,Search,Users,UserRound,Wallet,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useLang,type DictKey} from '@/lib/i18n';
import {teamTreeNodes} from '@/lib/team-tree';
import {commissionSummary,rankFor,teamStats} from '@/lib/admin-rules';
import {canAccess} from '@/lib/admin-permissions';
import type {AdminData} from './AdminPanel';

export function AdminTeamTree({data,rootId}:{data:AdminData;rootId?:string}) {
  const {t,lang}=useLang();
  const [query,setQuery]=useState('');
  const [root,setRoot]=useState('all');
  const [level,setLevel]=useState('all');
  const [rank,setRank]=useState('all');
  const [focus,setFocus]=useState<string>();
  const [selected,setSelected]=useState<string>();
  const viewport=useRef<HTMLDivElement>(null);
  const nodes=useMemo(()=>{
    const result=teamTreeNodes(data.affiliates,focus||rootId);
    if(result.length) return result;
    const admin=data.userRoles.find(r=>r.role==='admin');
    return admin?[{id:admin.user_id,parentId:null,level:0,rootId:admin.user_id}]:result;
  },[data.affiliates,data.userRoles,rootId,focus]);
  const users=new Map(data.users.map(u=>[u.id,u]));
  const roots=nodes.filter(n=>n.parentId===null);
  const levels=[...new Set(nodes.map(n=>n.level))].sort((a,b)=>a-b);
  const name=(id:string)=>users.get(id)?.full_name||users.get(id)?.referral_code||'—';
  const shown=nodes.filter(n=>{
    const u=users.get(n.id);
    const rk=rankFor(n.id,data.ranks,data.affiliates,data.orders);
    return (root==='all'||n.rootId===root)&&(level==='all'||n.level===Number(level))&&(rank==='all'||(rank==='none'?!rk:rk?.name===rank))&&[n.id,u?.full_name,u?.phone,u?.email,u?.referral_code,u?.city,u?.state].some(v=>String(v??'').toLowerCase().includes(query.trim().toLowerCase()));
  });
  const status=(value:string)=>t((['active','paused'].includes(value)?value:`admin_${value}`) as DictKey);
  const date=(value:string|null|undefined)=>value?new Date(value).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN'):'—';
  const currency=(value:number)=>new Intl.NumberFormat(lang==='hi'?'hi-IN':'en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
  const earnings=(id?:string)=>{
    const ids=new Set(nodes.map(n=>n.id));
    const summary=commissionSummary(data.commissions.filter(c=>id?c.user_id===id:ids.has(c.user_id)));
    return summary.approved+summary.paid-summary.tds;
  };
  // Card total: all genuine income earned so far, including amounts still in the holding period.
  const income=(id:string)=>data.commissions.filter(c=>c.user_id===id&&['pending','approved','paid'].includes(c.status)).reduce((a,c)=>a+Number(c.amount||0)-Number(c.tds_amount||0),0);
  const matching=new Set(shown.map(n=>n.id));
  const included=new Set(matching);
  const byId=new Map(nodes.map(n=>[n.id,n]));
  for(const n of shown){let parent=n.parentId;const seen=new Set<string>();while(parent&&!seen.has(parent)){seen.add(parent);included.add(parent);parent=byId.get(parent)?.parentId??null;}}
  const children=new Map<string,typeof nodes>();
  for(const n of nodes){if(n.parentId&&included.has(n.id)){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}}
  const chosen=selected?byId.get(selected):undefined;
  const member=chosen?users.get(chosen.id):undefined;
  const stats=chosen?teamStats(chosen.id,data.affiliates):undefined;
  function avatar(id:string,large=false){
    const u=users.get(id);
    return <span className={`tree-avatar ${large?'tree-avatar-large':''}`}><span className="tree-avatar-image">{u?.avatar_url?<img src={u.avatar_url} alt={name(id)}/>:<UserRound size={large?34:26}/>}</span>{u?.account_status==='active'&&<span className="tree-status-dot" title={status('active')}/>}</span>;
  }
  function renderBranch(n:typeof nodes[number]):React.ReactNode {
    const u=users.get(n.id);const st=teamStats(n.id,data.affiliates);const rk=rankFor(n.id,data.ranks,data.affiliates,data.orders);
    const kids=children.get(n.id)??[];
    return <li key={n.id} className="team-tree-branch">
      <Button variant="ghost" className={`team-tree-member ${n.level===0?'tree-root-member':''} ${selected===n.id?'tree-member-selected':''} ${matching.has(n.id)?'':'tree-member-context'}`} aria-label={`${t('tree_details')}: ${name(n.id)}`} aria-pressed={selected===n.id} onClick={()=>setSelected(n.id)}>
        {n.level===0&&<span className="tree-root-label"><Crown size={14}/>{t('admin_team_root')}</span>}
        {avatar(n.id,n.level===0)}
        <span className="tree-node-copy"><span className="tree-node-name">{name(n.id)}</span><span className="tree-id-row"><span className="tree-member-id">{u?.referral_code||'—'}</span><span className="tree-level">L{n.level}</span></span>{rk&&<span className="tree-node-rank">{rk.name}</span>}</span>
        <span className="tree-node-footer"><span><Users size={15}/>{t('admin_total_members')}: <strong>{st.total}</strong></span><span className="tree-node-earn" title={t('wallet_total_earned')}><Wallet size={14}/>{currency(income(n.id))}</span></span>
      </Button>
      {kids.length>0&&<ul className="team-tree-children">{kids.map(renderBranch)}</ul>}
    </li>;
  }
  const direct=nodes.filter(n=>n.level===1).length;
  const metrics:[DictKey,string|number,typeof Users,string][]=[
    ['tree_network',nodes.length,Users,'tree-stat-blue'],
    ['admin_total_members',nodes.filter(n=>n.level>0).length,Network,'tree-stat-green'],
    ['wallet_total_earned',earnings(),Wallet,'tree-stat-navy'],
    ['admin_direct_members',direct,GitBranch,'tree-stat-gold'],
    ['tree_active_members',nodes.filter(n=>users.get(n.id)?.account_status==='active').length,CheckCircle2,'tree-stat-rose'],
  ];
  const rows:[DictKey,string,typeof Phone][] = chosen&&member?[
    ['phone_req',member.phone||'—',Phone],['email',member.email||'—',Mail],['admin_date',date(member.created_at),CalendarDays],
    ['wallet_total_earned',currency(earnings(chosen.id)),Wallet],['admin_total_members',String(stats?.total??0),Network],['admin_direct_members',String(stats?.direct??0),Users],
    ['tree_parent',chosen.parentId?name(chosen.parentId):'—',GitBranch],['city',[member.city,member.state].filter(Boolean).join(', ')||'—',MapPin],
    ['profile_address',member.address||'—',MapPin],['kyc_status',t(`kyc_${member.kyc_status}` as DictKey),CheckCircle2],
    ['admin_verification',status(member.verification_status),CheckCircle2],['tree_birth',date(member.date_of_birth),CalendarDays],
    ['tree_language',member.preferred_language||'—',UserRound],['tree_updated',date(member.updated_at),CalendarDays],['profile_bio',member.bio||'—',UserRound],
  ]:[];
  return <section className="admin-team-tree">
    <header className="tree-toolbar"><h2 className="tree-title"><Network size={26}/><span>{t('tree_unilevel')}<small>{t('tree_network')}</small></span></h2><label className="tree-search"><Search size={18}/><input aria-label={t('admin_search')} placeholder={t('tree_search_members')} value={query} onChange={e=>setQuery(e.target.value)}/></label></header>
    <div className="tree-summary">{metrics.map(([label,value,Icon,tone])=><article key={label} className={`tree-stat ${tone}`}><Icon size={28}/><div><p>{t(label)}</p><strong>{label==='wallet_total_earned'?currency(Number(value)):value.toLocaleString(lang==='hi'?'hi-IN':'en-IN')}</strong></div></article>)}</div>
    <div className="tree-filters">
      {!rootId&&<select aria-label={t('admin_team_root')} value={root} onChange={e=>setRoot(e.target.value)}><option value="all">{t('tree_all_roots')}</option>{roots.map(n=><option key={n.id} value={n.id}>{name(n.id)}</option>)}</select>}
      <select aria-label={t('admin_level')} value={level} onChange={e=>setLevel(e.target.value)}><option value="all">{t('tree_all_levels')}</option>{levels.map(l=><option key={l} value={l}>{l===0?t('admin_team_root'):`${t('admin_level')} ${l}`}</option>)}</select>
      <select aria-label={t('admin_rank')} value={rank} onChange={e=>setRank(e.target.value)}><option value="all">{t('admin_rank')}: {t('filter_all')}</option><option value="none">{t('admin_no_rank')}</option>{data.ranks.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}</select>
      <div className="tree-canvas-controls"><span>{t('tree_levels')}: <strong>{levels.filter(l=>l>0).length}</strong></span><Button variant="outline" size="icon" title={t('tree_reset_view')} aria-label={t('tree_reset_view')} onClick={()=>{setFocus(undefined);setRoot('all');setLevel('all');setRank('all');setQuery('');setSelected(undefined);viewport.current?.scrollTo({left:0,top:0});}}><RotateCcw size={16}/></Button><Button variant="outline" size="icon" title={t('tree_previous')} aria-label={t('tree_previous')} onClick={()=>viewport.current?.scrollBy({left:-320,behavior:'smooth'})}><ArrowLeft size={18}/></Button><Button variant="outline" size="icon" title={t('tree_next')} aria-label={t('tree_next')} onClick={()=>viewport.current?.scrollBy({left:320,behavior:'smooth'})}><ArrowRight size={18}/></Button></div>
    </div>
    <div className={`tree-workspace ${chosen?'tree-with-inspector':''}`}>
      <div ref={viewport} className="team-tree-viewport" tabIndex={0} role="region" aria-label={t('admin_teamtree_real')}>{shown.length?<ul className="team-tree-roots">{roots.filter(n=>included.has(n.id)).map(renderBranch)}</ul>:<p className="tree-empty">{t('admin_empty')}</p>}</div>
      {chosen&&<aside className="tree-inspector" aria-label={t('tree_details')}>
        <header className="tree-inspector-header"><Button variant="ghost" size="icon" className="tree-inspector-close" aria-label={t('admin_close_team')} title={t('admin_close_team')} onClick={()=>setSelected(undefined)}><X size={21}/></Button>{avatar(chosen.id,true)}<div className="min-w-0"><h3>{name(chosen.id)}</h3><span className={`tree-account-status ${member?.account_status==='active'?'tree-account-active':''}`}><CheckCircle2 size={14}/>{member?status(member.account_status):'—'}</span><p className="tree-inspector-id">{member?.referral_code||'—'}</p></div></header>
        <dl className="tree-inspector-rows">{rows.map(([label,value,Icon])=><div key={label}><dt><Icon size={18}/>{t(label)}</dt><dd>{value}</dd></div>)}</dl>
        <footer className="tree-inspector-actions"><Button variant="secondary" onClick={()=>{setFocus(chosen.id);setRoot('all');setLevel('all');setRank('all');setQuery('');viewport.current?.scrollTo({left:0,top:0});}}><Network size={16}/>{t('tree_view_downline')}</Button>{canAccess(data.access,'users')&&<Button asChild><Link to="/admin/user/$userId" params={{userId:chosen.id}}><Eye size={16}/>{t('admin_view_profile')}</Link></Button>}</footer>
      </aside>}
    </div>
  </section>;
}
