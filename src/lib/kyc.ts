import { z } from 'zod';
export const kycDocumentType = z.enum(['pan', 'aadhaar', 'voter_id']);
export function kycFileAllowed(file: {type:string;size:number}) {
  return ['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type) && file.size > 0 && file.size <= 10 * 1024 * 1024;
}
export const kycReviewInput=z.object({id:z.string().uuid(),approve:z.boolean(),note:z.string().trim().max(500)}).refine(v=>v.approve||v.note.length>0);