import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Copy, GitBranch, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';
import { studentReferralsOptions } from '@/lib/student-referrals';

export function StudentReferrals({ userId, mode }: { userId: string; mode: 'tree' | 'team' }) {
  const { t, lang } = useLang();
  const { data } = useSuspenseQuery(studentReferralsOptions(userId));
  const code = data.profile?.referral_code;
  return <main className="w-full px-4 py-8">
    <h1 className="font-display text-3xl font-bold">{t(mode === 'tree' ? 'student_referral_tree' : 'student_team')}</h1>
    <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-border py-4">
      <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{t('admin_ref_code')}</p><p className="break-all font-mono font-semibold">{code || t('student_code_missing')}</p></div>
      {code && <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(code); toast.success(t('copied')); } catch { toast.error(t('admin_error')); } }}><Copy size={16} />{t('copy')}</Button>}
      <Button asChild variant="outline"><Link to="/earnings"><Wallet size={16} />{t('wallet')}</Link></Button>
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Users size={20} />{t('student_direct_team')} ({data.members.length})</h2>
      <Button asChild variant="ghost"><Link to={mode === 'tree' ? '/team' : '/referrals'}><GitBranch size={16} />{t(mode === 'tree' ? 'student_team' : 'student_referral_tree')}</Link></Button>
    </div>
    {mode === 'tree' && <div className="mt-6 flex flex-col items-center"><div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-5 py-3 font-semibold"><Users size={20} />{data.profile?.full_name || t('you')}</div><div className="h-8 w-px bg-border" /></div>}
    {!data.members.length ? <p className="py-10 text-center text-muted-foreground">{t('student_team_empty')}</p> : mode === 'tree' ?
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{data.members.map(member => <article key={member.id} className="min-w-0 rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{t('student_member_id')}</p><p className="mt-1 break-all font-mono text-sm">{member.referred_id}</p><p className="mt-2 text-xs text-muted-foreground">{t('up_joined')}: {new Date(member.created_at).toLocaleDateString(lang)}</p></article>)}</div> :
      <div className="mt-4 overflow-x-auto border-y border-border"><table className="w-full text-left text-sm"><thead className="bg-muted/40"><tr><th className="p-3">{t('student_member_id')}</th><th className="p-3">{t('admin_level')}</th><th className="p-3">{t('up_joined')}</th></tr></thead><tbody>{data.members.map(member => <tr key={member.id} className="border-t border-border"><td className="break-all p-3 font-mono">{member.referred_id}</td><td className="p-3">1</td><td className="whitespace-nowrap p-3">{new Date(member.created_at).toLocaleDateString(lang)}</td></tr>)}</tbody></table></div>}
    <p className="mt-8 text-xs text-muted-foreground">{t('admin_real_commission')}</p>
  </main>;
}