export type PaymentUpi = { upi_id: string; payee: string; qr_path?: string };

export function paymentUpiLink(upi: PaymentUpi | null | undefined, purchase?: { price: number; title: string }): string {
  if (!upi?.upi_id) return '';
  const params = new URLSearchParams({ pa: upi.upi_id, pn: upi.payee, cu: 'INR' });
  if (purchase) {
    params.set('am', String(purchase.price));
    params.set('tn', purchase.title.slice(0, 40));
  }
  return `upi://pay?${params.toString()}`;
}

/** Payment is usable when admin saved either a UPI ID or an uploaded QR image. */
export function paymentConfigured(upi: PaymentUpi | null | undefined): boolean {
  return Boolean(upi?.upi_id || upi?.qr_path);
}

/** Uploaded QR always wins over the generated one so students scan exactly what admin uploaded. */
export function qrSource(upi: PaymentUpi | null | undefined): 'uploaded' | 'generated' | 'none' {
  if (upi?.qr_path) return 'uploaded';
  if (upi?.upi_id) return 'generated';
  return 'none';
}

export function qrUploadAllowed(file: { type: string; size: number }): boolean {
  return /^image\/(png|jpe?g|webp)$/.test(file.type) && file.size <= 5 * 1024 * 1024;
}
