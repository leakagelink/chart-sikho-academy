import { describe, expect, it } from 'vitest';
import { paymentUpiLink, coursePaymentAmount } from './payment-upi';

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
import { paymentConfigured, qrSource, qrUploadAllowed } from './payment-upi';

describe('uploaded payment QR', () => {
  it('shows the uploaded QR to students instead of a generated one', () => {
    expect(qrSource({ upi_id: 'a@bank', payee: 'X', qr_path: 'qr/1.png' })).toBe('uploaded');
    expect(qrSource({ upi_id: 'a@bank', payee: 'X', qr_path: '' })).toBe('generated');
  });
  it('allows payment with only an uploaded QR and no UPI ID', () => {
    expect(paymentConfigured({ upi_id: '', payee: '', qr_path: 'qr/1.png' })).toBe(true);
    expect(paymentConfigured({ upi_id: '', payee: '', qr_path: '' })).toBe(false);
  });
  it('accepts only PNG/JPG/WebP up to 5 MB', () => {
    expect(qrUploadAllowed({ type: 'image/png', size: 5 * 1024 * 1024 })).toBe(true);
    expect(qrUploadAllowed({ type: 'application/pdf', size: 100 })).toBe(false);
    expect(qrUploadAllowed({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).toBe(false);
  });
});

describe('course checkout amount',()=>{
 it('uses the saved offer, not the regular price',()=>{expect(coursePaymentAmount({price:24999,sale_price:3999})).toBe(3999);});
 it('uses regular price without an offer',()=>{expect(coursePaymentAmount({price:24999,sale_price:null})).toBe(24999);});
 it('retains a free saved offer',()=>{expect(coursePaymentAmount({price:24999,sale_price:0})).toBe(0);});
});
