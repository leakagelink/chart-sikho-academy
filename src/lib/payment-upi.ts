export type PaymentUpi = { upi_id: string; payee: string };

export function paymentUpiLink(upi: PaymentUpi | null | undefined, purchase?: { price: number; title: string }): string {
  if (!upi?.upi_id) return '';
  const params = new URLSearchParams({ pa: upi.upi_id, pn: upi.payee, cu: 'INR' });
  if (purchase) {
    params.set('am', String(purchase.price));
    params.set('tn', purchase.title.slice(0, 40));
  }
  return `upi://pay?${params.toString()}`;
}