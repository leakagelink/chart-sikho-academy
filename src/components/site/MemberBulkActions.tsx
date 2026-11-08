import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Ban, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { changeAdminRecord } from '@/lib/admin.functions';
import { applyMemberBatch } from '@/lib/member-selection';
import { useLang, type DictKey } from '@/lib/i18n';

export function MemberBulkActions({section, ids, all, onAll, onComplete}: {
  section: 'verification' | 'blocked'; ids: string[]; all: boolean; onAll: (checked: boolean) => void; onComplete: (failed: string[]) => void;
}) {
  const {t}=useLang();
  const change=useServerFn(changeAdminRecord);
  const qc=useQueryClient();
  const [pending,setPending]=useState(false);
  const [action,setAction]=useState<string|null>(null);
  const [result,setResult]=useState<{succeeded:number;failed:string[]}|null>(null);
  const actions: {value:string;label:DictKey;icon:typeof Check}[]=section==='verification'
    ? [{value:'verified',label:'admin_verify',icon:Check},{value:'rejected',label:'admin_reject',icon:X}]
    : [{value:'active',label:'activate',icon:Check},{value:'blocked',label:'admin_block',icon:Ban},{value:'paused',label:'pause',icon:Pause}];
  async function submit() {
    if(!action||pending)return;
    setPending(true);
    const outcome=await applyMemberBatch(ids,id=>change({data:{resource:section==='verification'?'verification':'users',id,values:section==='verification'?{verification_status:action}:{account_status:action}}}));
    setResult(outcome);
    await qc.invalidateQueries({queryKey:['real-admin']});
    onComplete(outcome.failed);setPending(false);setAction(null);
  }
  return <div className="mb-4 space-y-2 border-y border-border py-3">
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex shrink-0 items-center gap-2 text-sm"><input type="checkbox" checked={all} disabled={pending} onChange={e=>onAll(e.target.checked)} className="h-4 w-4 accent-primary"/>{t('member_select_all')}</label>
      <span className="text-sm text-muted-foreground">{ids.length} {t('member_selected')}</span>
      {actions.map(({value,label,icon:Icon})=><Button key={value} size="sm" variant="outline" disabled={!ids.length||pending} onClick={()=>{setResult(null);setAction(value);}}><Icon size={15}/>{t(label)}</Button>)}
    </div>
    {result&&<p role="status" className="text-sm">{result.succeeded} {t('member_updated')}{result.failed.length>0&&<> · {result.failed.length} {t('member_failed')}</>}</p>}
    <AlertDialog open={action!==null} onOpenChange={open=>{if(!open&&!pending)setAction(null);}}>
      <AlertDialogContent className="admin-dialog"><AlertDialogHeader><AlertDialogTitle>{t('member_confirm')}</AlertDialogTitle><AlertDialogDescription>{actions.find(item=>item.value===action)&&t(actions.find(item=>item.value===action)?.label??'admin_action')} · {ids.length} {t('member_selected')}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={pending}>{t('admin_cancel')}</AlertDialogCancel><Button disabled={pending} onClick={submit}>{t('member_apply')}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}