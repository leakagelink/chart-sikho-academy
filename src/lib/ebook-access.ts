export function canOpenEbook(price: number, paid: boolean) {
  return price === 0 || paid;
}