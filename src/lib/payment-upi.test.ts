import { describe, expect, it } from 'vitest';
import { paymentUpiLink } from './payment-upi';

describe('configured payment destination', () => {
  it('uses the same saved UPI and payee in admin QR and student checkout', () => {
    const configured = { upi_id: 'chartsikho@bank', payee: 'ChartSikho' };
    const admin = new URL(paymentUpiLink(configured));
    const student = new URL(paymentUpiLink(configured, { price: 3999, title: 'Course' }));
    expect(admin.searchParams.get('pa')).toBe('chartsikho@bank');
    expect(student.searchParams.get('pa')).toBe(admin.searchParams.get('pa'));
    expect(student.searchParams.get('pn')).toBe('ChartSikho');
  });
  it('changes both QR destinations when the saved UPI changes', () => {
    const configured = { upi_id: 'updated@bank', payee: 'New payee' };
    expect(new URL(paymentUpiLink(configured)).searchParams.get('pa')).toBe('updated@bank');
    expect(new URL(paymentUpiLink(configured, { price: 3999, title: 'Course' })).searchParams.get('pa')).toBe('updated@bank');
  });
});