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