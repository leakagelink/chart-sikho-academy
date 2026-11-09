import { expect, it } from 'vitest';
import { filterAffiliateRows, emptyAffiliateFilters } from './affiliate-filters';
const rows = [
  { id:'member-a', created_at:'2026-11-01T12:00:00Z',status:'approved',level:1 },
  { id:'member-b', created_at:'2026-11-06T12:00:00Z',status:'pending',level:2 },
  { id:'member-c', created_at:'2026-10-01T12:00:00Z',status:'approved',level:1 },
];
it('filters affiliate data by member/reference search', () => {
  expect(filterAffiliateRows(rows,{...emptyAffiliateFilters,search:'MEMBER-B'},r=>r.id).map(r=>r.id)).toEqual(['member-b']);
});
it('finds a referred member by saved name while retaining member-ID search', () => {
  const members = [{referred_id:'member-a',full_name:'Pramod Kumar',created_at:'2026-11-01'}, {referred_id:'member-b',full_name:'Dheeraj Tagde',created_at:'2026-11-02'}];
  const searchText = (m:typeof members[number]) => `${m.full_name} ${m.referred_id}`;
  expect(filterAffiliateRows(members,{...emptyAffiliateFilters,search:'pramod'},searchText).map(m=>m.referred_id)).toEqual(['member-a']);
  expect(filterAffiliateRows(members,{...emptyAffiliateFilters,search:'member-b'},searchText).map(m=>m.full_name)).toEqual(['Dheeraj Tagde']);
});
it('filters by inclusive date range', () => {
  expect(filterAffiliateRows(rows,{...emptyAffiliateFilters,from:'2026-11-01',to:'2026-11-06'},r=>r.id).map(r=>r.id)).toEqual(['member-b','member-a']);
});
it('filters commission status and level together', () => {
  expect(filterAffiliateRows(rows,{...emptyAffiliateFilters,status:'pending',level:'2'},r=>r.id).map(r=>r.id)).toEqual(['member-b']);
});
it('allows oldest-first sorting and reset to all rows', () => {
  expect(filterAffiliateRows(rows,{...emptyAffiliateFilters,sort:'oldest'},r=>r.id).map(r=>r.id)).toEqual(['member-c','member-a','member-b']);
  expect(filterAffiliateRows(rows,emptyAffiliateFilters,r=>r.id)).toHaveLength(3);
});