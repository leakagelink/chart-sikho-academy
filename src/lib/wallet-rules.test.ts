import { describe, expect, it } from 'vitest';
import { emptyPayoutDetails, validPayoutDetails, payoutTotals, uniquePayments } from './wallet-rules';
describe('user wallet', () => {
  it('requires complete selected bank details', () => {
    expect(validPayoutDetails({ ...emptyPayoutDetails, preferred_method: 'bank' })).toBe(false);
    expect(validPayoutDetails({ ...emptyPayoutDetails, preferred_method: 'bank', account_holder: 'Test User', bank_name: 'Test Bank', account_number: '123456789012', ifsc: 'TEST0123456' })).toBe(true);
  });
  it('requires a valid selected UPI destination', () => {
    expect(validPayoutDetails({ ...emptyPayoutDetails, preferred_method: 'upi', upi_id: 'test@bank' })).toBe(true);
    expect(validPayoutDetails({ ...emptyPayoutDetails, preferred_method: 'upi', upi_id: 'invalid' })).toBe(false);
  });
  it('shows actual withdrawals separately from pending requests', () => {
    expect(payoutTotals([{ amount: 800, status: 'paid' }, { amount: 500, status: 'pending' }, { amount: 200, status: 'reviewed' }, { amount: 100, status: 'rejected' }])).toEqual({ paid: 800, processing: 700 });
  });
  it('does not count approved payment proof and its order twice', () => {
    expect(uniquePayments([{ id: 'paid-order' }, { id: 'other-order' }], [{ order_id: 'paid-order' }])).toEqual([{ id: 'other-order' }]);
  });
});