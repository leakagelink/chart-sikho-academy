import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { myKycQuery } from '@/lib/kyc-query';
import { useLang, type DictKey } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
export const kycStatusKey=(status:string):DictKey=>status==='verified'||status==='approved'?'kyc_verified':status==='pending'?'kyc_pending':status==='rejected'?'kyc_rejected':'kyc_unverified';
export function KycStatus(){const {t}=useLang();const {data}=useQuery(myKycQuery());return <section className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-4"><div className="flex items-center gap-2"><ShieldCheck className="text-primary"/><span>{t('kyc_status')}: <strong>{data?t(kycStatusKey(data.status)):'…'}</strong></span></div><Button asChild variant="outline"><Link to="/kyc">{t('kyc_title')}</Link></Button></section>;}