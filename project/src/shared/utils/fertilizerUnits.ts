export const UREA_BAGS_PER_MT = 22.222222222223;
export const DEFAULT_BAGS_PER_MT = 20;

export function bagsPerMt(productName: string): number {
  return productName.trim().toLowerCase() === 'urea' ? UREA_BAGS_PER_MT : DEFAULT_BAGS_PER_MT;
}

export function mtToBags(mt: number, productName: string): number {
  return (Number(mt) || 0) * bagsPerMt(productName);
}

export function bagsToMt(bags: number, productName: string): number {
  return (Number(bags) || 0) / bagsPerMt(productName);
}

export function formatMt(value: number): string {
  return (Number(value) || 0).toFixed(3).replace(/\.?0+$/, '');
}

export function formatBags(value: number): string {
  return String(Math.round(Number(value) || 0));
}

export function formatFertilizerDual(mt: number, productName: string): string {
  return `${formatMt(mt)} MT / ${formatBags(mtToBags(mt, productName))} Bags`;
}
