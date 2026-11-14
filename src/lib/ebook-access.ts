/** A student can open an eBook when it is free or the database lists it in their library (purchase or membership). */
export function canOpenEbook(price: number, inLibrary: boolean) {
  return price === 0 || inLibrary;
}
