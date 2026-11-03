import { useState } from 'react';
import { useMutation,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Save,ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLang,type DictKey } from '@/lib/i18n';
import { adminNav } from '@/lib/admin-nav';
import { permissionActions,type PanelPermission } from '@/lib/admin-permissions';
import { savePanelPermissions } from '@/lib/admin-permissions.functions';

export function PanelPermissions({users,permissions,userRoles}:{users:{id:string;full_name:string|null;phone:string|null}[];permissions:({user_id:string}&PanelPermission)[];userRoles:{user_id:string;role:string}[]}) {
  const {t}=useLang();const qc=useQueryClient();const save=useServerFn(savePanelPermissions);
  const [userId,setUserId]=useState('');const [selected,setSelected]=useState<PanelPermission[]>([]);const [message,setMessage]=useState('');const [userQuery,setUserQuery]=useState('');
  const q=userQuery.trim().toLowerCase();
  const filteredUsers=q?users.filter(u=>[u.full_name,u.phone,u.id].some(v=>String(v??'').toLowerCase().includes(q))):users;
  const isAdmin=userRoles.some(r=>r.user_id===userId&&r.role==='admin');
  const mutation=useMutation({mutationFn:save,onSuccess:async()=>{await qc.invalidateQueries({queryKey:['real-admin']});await qc.invalidateQueries({queryKey:['panel-access']});setMessage(t('saved'));},onError:()=>setMessage(t('admin_error'))});
  const choose=(id:string)=>{setUserId(id);setSelected(permissions.filter(p=>p.user_id===id).map(({section,action})=>({section,action})));setMessage('');};
  const toggle=(p:PanelPermission,on:boolean)=>{setMessage('');setSelected(prev=>{
    if(!on)return prev.filter(x=>!(x.section===p.section&&(p.action==='view'||x.action===p.action)));
    const next=prev.filter(x=>!(x.section===p.section&&x.action===p.action));next.push(p);
    if(p.action!=='view'&&!next.some(x=>x.section===p.section&&x.action==='view'))next.push({section:p.section,action:'view'});
    return next;
  });};
  return <section className="mb-8 border-y border-border py-5">
    <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><ShieldCheck size={20}/>{t('panel_permissions')}</h2>
    <label className="block max-w-md text-sm font-medium"><span>{t('admin_search_user')}</span><input aria-label={t('admin_search_user')} value={userQuery} onChange={e=>setUserQuery(e.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2"/></label>
    <label className="mt-3 block max-w-md text-sm font-medium">{t('admin_student')}<select aria-label={t('panel_choose_user')} value={userId} disabled={mutation.isPending} onChange={e=>choose(e.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2"><option value="">—</option>{filteredUsers.map(u=><option key={u.id} value={u.id}>{[u.full_name||u.id.slice(0,8),u.phone||null,u.id.slice(0,8)].filter(Boolean).join(' · ')}</option>)}</select></label>
    {userId&&(isAdmin?<p className="mt-4 text-sm text-muted-foreground">{t('panel_full_admin')}</p>:<>
      <div className="mt-5 max-h-[60dvh] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-background"><tr><th className="py-3">{t('panel_section')}</th>{permissionActions.map(a=><th key={a} className="px-3 py-3 text-center">{t(`panel_${a}` as DictKey)}</th>)}</tr></thead><tbody>{adminNav.map(g=><FragmentGroup key={g.group} group={t(g.group)}>{g.items.flatMap(it=>'section'in it?[<tr key={it.section} className="border-t border-border"><td className="min-w-40 py-3">{t(`admin_${it.section}_real` as DictKey)}</td>{permissionActions.map(action=><td key={action} className="px-3 py-3 text-center"><Checkbox aria-label={`${t(`admin_${it.section}_real` as DictKey)} — ${t(`panel_${action}` as DictKey)}`} disabled={mutation.isPending||(it.section==='roles'&&action!=='view')||(action==='delete'&&!['courses','builder','lessons','videos'].includes(it.section))||(action==='create'&&['overview','users','videos','orders','payments','affiliates','commissions','payouts','settings','progress','reviews','pricing','refunds','verification','blocked','bulk','refsettings','reflinks','teamtree','commrules','fraud','maintenance'].includes(it.section))||(action==='edit'&&['overview','videos','orders','payments','affiliates','commissions','progress','bulk','reflinks','teamtree','commrules','fraud'].includes(it.section))} checked={selected.some(p=>p.section===it.section&&p.action===action)} onCheckedChange={v=>toggle({section:it.section,action},v===true)}/></td>)}</tr>]:[])}</FragmentGroup>)}</tbody></table></div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button disabled={mutation.isPending} onClick={()=>mutation.mutate({data:{userId,permissions:selected}})}><Save size={16}/>{t('save')}</Button><Button variant="outline" disabled={mutation.isPending} onClick={()=>{setSelected([]);setMessage('');}}>{t('panel_clear')}</Button>{message&&<p role="status" className="text-sm">{message}</p>}</div>
    </>)}
  </section>;
}
import { Fragment,type ReactNode } from 'react';
function FragmentGroup({group,children}:{group:string;children:ReactNode}){return <Fragment><tr><th colSpan={5} className="bg-muted/40 py-2 text-xs text-muted-foreground">{group}</th></tr>{children}</Fragment>;}