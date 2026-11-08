import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { kycDocumentType, kycReviewInput } from './kyc';
export const getMyKyc=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const p=await context.supabase.from('profiles').select('kyc_status').eq('id',context.userId).single();if(p.error)throw p.error;
  const r=await context.supabase.from('kyc_requests').select('*').eq('user_id',context.userId).order('created_at',{ascending:false});if(r.error)throw r.error;
  return {status:p.data.kyc_status,requests:r.data};
});
export const submitKyc=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({type:kycDocumentType,path:z.string().min(1).max(300)}).parse(v)).handler(async({context,data})=>{
  const r=await context.supabase.rpc('submit_kyc',{_type:data.type,_path:data.path});if(r.error)throw r.error;return r.data;
});
export const getAdminKyc=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const access=await context.supabase.rpc('has_panel_permission',{_section:'verification',_action:'view'});if(access.error||!access.data)throw new Error('Forbidden');
  const r=await context.supabase.from('kyc_requests').select('*,profiles(full_name,phone)').order('created_at',{ascending:false}).limit(1000);if(r.error)throw r.error;return r.data;
});
export const reviewKyc=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>kycReviewInput.parse(v)).handler(async({context,data})=>{
  const r=await context.supabase.rpc('review_kyc',{_id:data.id,_approve:data.approve,_note:data.note});if(r.error)throw r.error;return true;
});