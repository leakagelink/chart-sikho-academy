import {useMemo,useState} from 'react';
import {Link} from '@tanstack/react-router';
import {ChevronDown,ChevronUp,Eye,Search,UserRound} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useLang,type DictKey} from '@/lib/i18n';
import {teamTreeNodes} from '@/lib/team-tree';
import {rankFor,teamStats} from '@/lib/admin-rules';
import {canAccess} from '@/lib/admin-permissions';
import type {AdminData} from './AdminPanel';

export function AdminTeamTree({data,rootId}:{data:AdminData;rootId?:string}) {
  const {t,lang}=useLang();
  const [query,setQuery]=useState('');
  const [root,setRoot]=useState('all');
  const [level,setLevel]=useState('all');
  const [rank,setRank]=useState('all');
  const [expanded,setExpanded]=useState<string[]>([]);
  const nodes=useMemo(()=>teamTreeNodes(data.affiliates,rootId),[data.affiliates,rootId]);
  const users=new Map(data.users.map(u=>[u.id,u]));
  const roots=nodes.filter(n=>n.parentId===null);
  const levels=[...new Set(nodes.map(n=>n.level))].sort((a,b)=>a-b);
  const name=(id:string)=>users.get(id)?.full_name||id.slice(0,8);
  const shown=nodes.filter(n=>{
    const u=users.get(n.id);
    const rk=rankFor(n.id,data.ranks,data.affiliates,data.orders);
    return (root==='all'||n.rootId===root)&&(level==='all'||n.level===Number(level))&&(rank==='all'||(rank==='none'?!rk:rk?.name===rank))&&[n.id,u?.full_name,u?.phone,u?.email,u?.referral_code,u?.city,u?.state].some(v=>String(v??'').toLowerCase().includes(query.toLowerCase()));
  });
  const status=(value:string)=>t((['active','paused'].includes(value)?value:`admin_${value}`) as DictKey);
  const date=(value:string|null|undefined)=>value?new Date(value).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN'):'—';
  const matching=new Set(shown.map(n=>n.id));
  const included=new Set(matching);
  const byId=new Map(nodes.map(n=>[n.id,n]));
  for(const n of shown){let parent=n.parentId;const seen=new Set<string>();while(parent&&!seen.has(parent)){seen.add(parent);included.add(parent);parent=byId.get(parent)?.parentId??null;}}
  const children=new Map<string,typeof nodes>();
  for(const n of nodes){if(n.parentId&&included.has(n.id)){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}}
  function renderBranch(n:typeof nodes[number]):React.ReactNode {
        const u=users.get(n.id);const stats=teamStats(n.id,data.affiliates);const rk=rankFor(n.id,data.ranks,data.affiliates,data.orders);const detail=expanded.includes(n.id);
        const rows:[DictKey,string][]=[['phone_req',u?.phone||'—'],['email',u?.email||'—'],['admin_ref_code',u?.referral_code||'—'],['tree_parent',n.parentId?name(n.parentId):'—'],['city',[u?.city,u?.state].filter(Boolean).join(', ')||'—'],['status',u?status(u.account_status):'—'],['kyc_status',u?t(`kyc_${u.kyc_status}` as DictKey):'—']];
        const kids=children.get(n.id)??[];
        return <li key={n.id} className="team-tree-branch"><article className={`team-tree-member overflow-hidden rounded-lg border bg-card ${matching.has(n.id)?'border-primary/50':'border-border opacity-60'}`}>
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-sidebar px-4 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted">{u?.avatar_url?<img src={u.avatar_url} alt={name(n.id)} className="h-full w-full object-cover"/>:<UserRound size={23} className="text-muted-foreground"/>}</span><div className="min-w-0"><h3 className="break-words font-semibold">{name(n.id)}</h3><p className="text-xs text-muted-foreground">{rk?.name||t('admin_no_rank')}</p></div></div><span className="shrink-0 text-xs font-semibold text-primary">{n.level===0?t('admin_team_root'):`L${n.level}`}</span></header>
          <div className="grid grid-cols-2 gap-3 border-b border-border px-4 py-3 text-sm"><div><p className="text-xs text-muted-foreground">{t('admin_direct_members')}</p><strong>{stats.direct}</strong></div><div><p className="text-xs text-muted-foreground">{t('admin_total_members')}</p><strong>{stats.total}</strong></div></div>
          {detail&&<dl className="space-y-2 border-b border-border px-4 py-4">{[...rows,...([['admin_user_id',n.id],['profile_address',u?.address||'—'],['profile_bio',u?.bio||'—'],['admin_date',date(u?.created_at)],['tree_updated',date(u?.updated_at)],['tree_language',u?.preferred_language||'—'],['tree_birth',date(u?.date_of_birth)],['admin_verification',u?status(u.verification_status):'—']] as [DictKey,string][])].map(([label,value])=><div key={label} className="text-sm"><dt className="text-xs text-muted-foreground">{t(label)}</dt><dd className="mt-1 break-words">{value}</dd></div>)}</dl>}
          <footer className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"><Button variant="ghost" size="sm" aria-expanded={detail} onClick={()=>setExpanded(ids=>detail?ids.filter(id=>id!==n.id):[...ids,n.id])}>{detail?<ChevronUp size={16}/>:<ChevronDown size={16}/>} {t('tree_details')}</Button>{canAccess(data.access,'users')&&<Button asChild variant="outline" size="sm"><Link to="/admin/user/$userId" params={{userId:n.id}}><Eye size={15}/>{t('admin_view_profile')}</Link></Button>}</footer>
        </article>{kids.length>0&&<ul className="team-tree-children">{kids.map(renderBranch)}</ul>}</li>;
  }
  return <section className="admin-team-tree space-y-5">
    <div className="grid grid-cols-3 gap-3 border-y border-border py-4">{[{label:'admin_total_members' as DictKey,value:nodes.length},{label:'tree_levels' as DictKey,value:levels.filter(l=>l>0).length},{label:'admin_records_count' as DictKey,value:shown.length}].map(s=><div key={s.label} className="min-w-0"><p className="text-xs text-muted-foreground">{t(s.label)}</p><p className="mt-1 font-display text-2xl font-bold text-foreground">{s.value}</p></div>)}</div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="relative min-w-0 sm:col-span-2 xl:col-span-1"><Search size={18} className="absolute left-3 top-3 text-muted-foreground"/><input aria-label={t('admin_search')} placeholder={t('admin_search')} className="h-11 w-full min-w-0 rounded-md border border-input bg-background pl-10 pr-3 text-sm" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      {!rootId&&<select aria-label={t('admin_team_root')} className="h-11 min-w-0 rounded-md border border-input bg-background px-3 text-sm" value={root} onChange={e=>setRoot(e.target.value)}><option value="all">{t('tree_all_roots')}</option>{roots.map(n=><option key={n.id} value={n.id}>{name(n.id)}</option>)}</select>}
      <select aria-label={t('admin_level')} className="h-11 min-w-0 rounded-md border border-input bg-background px-3 text-sm" value={level} onChange={e=>setLevel(e.target.value)}><option value="all">{t('tree_all_levels')}</option>{levels.map(l=><option key={l} value={l}>{l===0?t('admin_team_root'):`${t('admin_level')} ${l}`}</option>)}</select>
      <select aria-label={t('admin_rank')} className="h-11 min-w-0 rounded-md border border-input bg-background px-3 text-sm" value={rank} onChange={e=>setRank(e.target.value)}><option value="all">{t('filter_all')}</option><option value="none">{t('admin_no_rank')}</option>{data.ranks.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}</select>
    </div>
    {shown.length>0&&<div className="team-tree-viewport" tabIndex={0} role="region" aria-label={t('admin_teamtree_real')}><ul className="team-tree-roots">{roots.filter(n=>included.has(n.id)).map(renderBranch)}</ul></div>}
    {!shown.length&&<p className="py-12 text-center text-muted-foreground">{t('admin_empty')}</p>}
  </section>;
}