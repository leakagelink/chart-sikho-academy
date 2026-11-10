import { describe, expect, it } from 'vitest';
import { studentTreeView, teamTotals, type NetworkMember } from './student-team-tree';

const m = (id: string, parent: string, level: number, name: string): NetworkMember => ({ id, referred_id: id, referrer_id: parent, level, full_name: name, member_code: id.toUpperCase(), created_at: '2026-01-01' });
const own: NetworkMember = { id: 'me', referred_id: 'me', referrer_id: null, level: 0, full_name: 'Me', member_code: 'CS000002', created_at: '' };
const team = [m('a', 'me', 1, 'Pramod'), m('b', 'a', 2, 'Nisha'), m('c', 'b', 3, 'Meyyan'), m('d', 'me', 1, 'Ravi')];

describe('Student team tree shows every referral level', () => {
  it('places deeper members under their own sponsor, not only direct referrals', () => {
    const view = studentTreeView(own, team, '', 'all');
    expect(view.children.get('me')?.map(x => x.referred_id)).toEqual(['a', 'd']);
    expect(view.children.get('a')?.map(x => x.referred_id)).toEqual(['b']);
    expect(view.children.get('b')?.map(x => x.referred_id)).toEqual(['c']);
    expect(view.levels).toEqual([0, 1, 2, 3]);
  });
  it('keeps the branch path to a searched deep member', () => {
    const view = studentTreeView(own, team, 'meyyan', 'all');
    expect([...view.matching]).toEqual(['c']);
    expect(view.children.get('me')?.map(x => x.referred_id)).toEqual(['a']);
    expect(view.children.get('b')?.map(x => x.referred_id)).toEqual(['c']);
  });
  it('filters by a chosen level', () => {
    expect([...studentTreeView(own, team, '', '2').matching]).toEqual(['b']);
  });
  it('counts every downline level under each member as their total team', () => {
    const totals = teamTotals(team);
    expect(totals.get('a')).toBe(2);
    expect(totals.get('b')).toBe(1);
    expect(totals.get('c')).toBe(0);
    expect(totals.get('d')).toBe(0);
  });
});
