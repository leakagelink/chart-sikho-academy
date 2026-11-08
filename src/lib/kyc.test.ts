import { describe, expect, it } from 'vitest';
import { kycDocumentType, kycFileAllowed, kycReviewInput } from './kyc';
describe('KYC rules',()=>{
  it('accepts PAN Aadhaar and Voter ID',()=>{for(const type of ['pan','aadhaar','voter_id'])expect(kycDocumentType.safeParse(type).success).toBe(true);expect(kycDocumentType.safeParse('passport').success).toBe(false);});
  it('accepts documents but not executable uploads',()=>{expect(kycFileAllowed({type:'application/pdf',size:1024})).toBe(true);expect(kycFileAllowed({type:'application/x-msdownload',size:1024})).toBe(false);expect(kycFileAllowed({type:'image/png',size:10485761})).toBe(false);});
  it('requires a reason for rejection',()=>{const id='207e6a42-ea41-4dc2-a27a-d24bc8e71ae9';expect(kycReviewInput.safeParse({id,approve:false,note:''}).success).toBe(false);expect(kycReviewInput.safeParse({id,approve:false,note:'Unreadable'}).success).toBe(true);expect(kycReviewInput.safeParse({id,approve:true,note:''}).success).toBe(true);});
});