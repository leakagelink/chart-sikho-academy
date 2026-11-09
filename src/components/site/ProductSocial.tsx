import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Send, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useLang } from '@/lib/i18n';
import { productSharePath, validProductComment, type SocialProductKind } from '@/lib/product-social';

export function ProductSocial({kind,id,title}:{kind:SocialProductKind;id:string;title:string}) {
  const {session}=useAuth(); const user=session?.user; const {t,lang}=useLang(); const client=useQueryClient();
  const [open,setOpen]=useState(false);const [sharing,setSharing]=useState(false);const [body,setBody]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [offset,setOffset]=useState(0);const [copied,setCopied]=useState(false);
  const key=['product-social',kind,id,user?.id];
  const summary=useQuery({queryKey:key,queryFn:async()=>{
    const r=await supabase.rpc('product_social_summary',{_kind:kind,_id:id});if(r.error)throw r.error;
    let liked=false;if(user){const own=await supabase.from('product_likes').select('product_id').eq('product_kind',kind).eq('product_id',id).eq('user_id',user.id).maybeSingle();if(own.error)throw own.error;liked=!!own.data;}
    return {...r.data as {likes:number;comments:number},liked};
  },staleTime:30000});
  const feed=useQuery({queryKey:[...key,'comments',offset],enabled:open,queryFn:async()=>{const r=await supabase.rpc('product_comment_feed',{_kind:kind,_id:id,_offset:offset});if(r.error)throw r.error;return r.data;}});
  async function action(task:()=>PromiseLike<{error:unknown}>) {setBusy(true);setError('');try{const r=await task();if(r.error)throw r.error;await client.invalidateQueries({queryKey:['product-social',kind,id]});}catch{setError(t('admin_error'));}finally{setBusy(false);}}
  async function like(){if(!user){setOpen(true);return;}await action(()=>summary.data?.liked?supabase.from('product_likes').delete().eq('product_kind',kind).eq('product_id',id).eq('user_id',user.id):supabase.from('product_likes').insert({product_kind:kind,product_id:id,user_id:user.id}));}
  const url='https://chartsikho.in'+productSharePath(kind,id);
  async function share(){setCopied(false);setError('');if(navigator.share){try{await navigator.share({title,url});return;}catch(e){if(e instanceof Error&&e.name==='AbortError')return;}}setSharing(true);}
  async function copy(){try{await navigator.clipboard.writeText(url);setCopied(true);}catch{setError(t('social_copy_manual'));}}
  return <div className="mt-3 border-t border-border pt-2">
    <div className="grid grid-cols-3 gap-1">
      <Button variant="ghost" size="sm" aria-label={t('social_like')} title={t('social_like')} aria-pressed={summary.data?.liked??false} disabled={busy||summary.isPending||summary.isError} onClick={like} className={summary.data?.liked?'text-destructive':''}><Heart className={summary.data?.liked?'fill-current':''}/><span>{summary.data?.likes??'—'}</span></Button>
      <Button variant="ghost" size="sm" aria-label={t('social_comment')} title={t('social_comment')} onClick={()=>{setOffset(0);setOpen(true);}}><MessageCircle/><span>{summary.data?.comments??'—'}</span></Button>
      <Button variant="ghost" size="sm" aria-label={t('social_share')} title={t('social_share')} onClick={share}><Share2/></Button>
    </div>
    {(error||summary.isError)&&<p role="alert" className="mt-2 text-xs text-destructive">{error||t('admin_error')}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"><DialogTitle>{t('social_comments')}</DialogTitle><DialogDescription className="break-words">{title}</DialogDescription>
      {feed.isPending?<p>{t('admin_loading')}</p>:feed.isError?<p role="alert">{t('admin_error')}</p>:<div className="space-y-4">{feed.data?.map(c=><div key={c.id} className="border-b border-border pb-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="break-words text-sm font-semibold">{c.author}</p><p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN')}</p></div>{c.is_own&&<Button variant="ghost" size="icon" aria-label={t('social_delete')} title={t('social_delete')} disabled={busy} onClick={()=>action(()=>supabase.from('product_comments').delete().eq('id',c.id).eq('user_id',user?.id??''))}><Trash2/></Button>}</div><p className="mt-2 whitespace-pre-wrap break-words text-sm">{c.body}</p></div>)}{!feed.data?.length&&<p className="text-sm text-muted-foreground">{t('social_no_comments')}</p>}</div>}
      <div className="flex justify-between"><Button variant="ghost" disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-20))}>{t('wallet_previous')}</Button><Button variant="ghost" disabled={(feed.data?.length??0)<20} onClick={()=>setOffset(offset+20)}>{t('wallet_next')}</Button></div>
      {user?<form className="space-y-2" onSubmit={async e=>{e.preventDefault();if(!validProductComment(body))return;setBusy(true);setError('');const r=await supabase.from('product_comments').insert({product_kind:kind,product_id:id,user_id:user.id,body:body.trim()});if(r.error)setError(t('admin_error'));else{setBody('');setOffset(0);await client.invalidateQueries({queryKey:['product-social',kind,id]});}setBusy(false);}}><textarea aria-label={t('social_write')} placeholder={t('social_write')} value={body} onChange={e=>setBody(e.target.value)} maxLength={1000} rows={3} className="w-full resize-y rounded-md border border-input bg-card p-3 text-sm"/><Button type="submit" disabled={busy||!validProductComment(body)}><Send/>{t('social_post')}</Button></form>:<Button asChild><Link to="/auth" search={{redirect:productSharePath(kind,id)}}>{t('social_signin')}</Link></Button>}
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    </DialogContent></Dialog>
    <Dialog open={sharing} onOpenChange={setSharing}><DialogContent className="w-[calc(100%-2rem)] rounded-lg"><DialogTitle>{t('social_share')}</DialogTitle><DialogDescription className="break-words">{title}</DialogDescription><input readOnly aria-label={t('social_link')} value={url} onFocus={e=>e.target.select()} className="w-full rounded-md border border-input bg-card p-3 text-sm"/><Button onClick={copy}><Copy/>{t(copied?'social_copied':'social_copy')}</Button>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</DialogContent></Dialog>
  </div>;
}