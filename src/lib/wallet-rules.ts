export type PayoutDetails = { account_holder: string; bank_name: string; account_number: string; ifsc: string; upi_id: string; preferred_method: string };
export const emptyPayoutDetails: PayoutDetails = { account_holder: '', bank_name: '', account_number: '', ifsc: '', upi_id: '', preferred_method: 'none' };
export function validPayoutDetails(f: PayoutDetails) {
  const bank = !!f.account_holder.trim() && !!f.bank_name.trim() && /^\d{9,18}$/.test(f.account_number) && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc);
  const upi = /^[A-Za-z0-9._-]{2,100}@[A-Za-z0-9.-]{2,64}$/.test(f.upi_id);
  return ['none', 'bank', 'upi'].includes(f.preferred_method) && (!f.account_number || /^\d{9,18}$/.test(f.account_number)) && (!f.ifsc || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc)) && (!f.upi_id || upi) && (f.preferred_method !== 'bank' || bank) && (f.preferred_method !== 'upi' || upi);
}
export function payoutTotals(rows: { amount: number; status: string }[]) {
  return { paid: rows.filter(r => r.status === 'paid').reduce((n, r) => n + r.amount, 0), processing: rows.filter(r => ['pending', 'reviewed'].includes(r.status)).reduce((n, r) => n + r.amount, 0) };
}
export function uniquePayments<T extends { id: string }>(orders: T[], proofs: { order_id: string | null }[]) {
  const linked = new Set(proofs.map(p => p.order_id).filter(Boolean));
  return orders.filter(o => !linked.has(o.id));
}