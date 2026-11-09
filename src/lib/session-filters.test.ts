import { describe, expect, it } from 'vitest';
import { filterSessions } from './session-filters';

const rows = [
  { title: 'Paid webinar', starts_at: '2027-01-02T10:00:00Z', access_mode: 'paid', price: 499 },
  { title: 'Free class', starts_at: '2027-01-01T10:00:00Z', access_mode: 'free', price: 0 },
  { title: 'Past webinar', starts_at: '2026-01-01T10:00:00Z', access_mode: 'paid', price: 69 },
];
const now = Date.parse('2026-11-09T06:53:00Z');
describe('student session filters', () => {
  it('includes both free and paid upcoming sessions', () => {
    expect(filterSessions(rows, { timing: 'upcoming', price: 'all', search: '' }, now).map(r => r.title)).toEqual(['Free class', 'Paid webinar']);
  });
  it('paid filter keeps the saved amount', () => {
    expect(filterSessions(rows, { timing: 'upcoming', price: 'paid', search: '' }, now)).toEqual([rows[0]]);
  });
  it('free filter excludes paid rows', () => {
    expect(filterSessions(rows, { timing: 'all', price: 'free', search: '' }, now)).toEqual([rows[1]]);
  });
  it('past filter does not include future sessions', () => {
    expect(filterSessions(rows, { timing: 'past', price: 'all', search: '' }, now)).toEqual([rows[2]]);
  });
  it('search combines with timing and price filters', () => {
    expect(filterSessions(rows, { timing: 'upcoming', price: 'paid', search: ' WEBINAR ' }, now)).toEqual([rows[0]]);
  });
});