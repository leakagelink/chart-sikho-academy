import { describe,it,expect } from 'vitest';
import { canAccess,canReadDataset,resourceSections,permissionSchema } from './admin-permissions';
describe('Individual panel permissions',()=>{
  const access={isAdmin:false,permissions:[{section:'quizzes' as const,action:'view' as const},{section:'quizzes' as const,action:'create' as const}]};
  it('only displays granted sections',()=>{expect(canAccess(access,'quizzes')).toBe(true);expect(canAccess(access,'users')).toBe(false);});
  it('limits actions independently',()=>{expect(canAccess(access,'quizzes','create')).toBe(true);expect(canAccess(access,'quizzes','edit')).toBe(false);expect(canAccess(access,'quizzes','delete')).toBe(false);});
  it('revocation removes access',()=>{expect(canAccess({isAdmin:false,permissions:[]},'quizzes')).toBe(false);});
  it('does not expose unrelated purchases',()=>{expect(canReadDataset(access,'questions')).toBe(true);expect(canReadDataset(access,'orders')).toBe(false);});
  it('does not permit privilege escalation',()=>{expect(canAccess({isAdmin:false,permissions:[{section:'roles',action:'edit'}]},'roles','edit')).toBe(false);});
  it('admin retains full access',()=>{expect(canAccess({isAdmin:true,permissions:[]},'users','delete')).toBe(true);});
  it('direct question creation can use quiz permission',()=>{expect(resourceSections('questions')).toContain('quizzes');});
  it('rejects invented sections',()=>{expect(permissionSchema.safeParse({userId:'4983f790-7312-4cc2-b3e7-8bf374f535ed',permissions:[{section:'anything',action:'view'}]}).success).toBe(false);});
});