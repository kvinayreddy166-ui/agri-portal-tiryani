import { FINANCIAL_YEARS, currentReportDate, financialYearForDate, financialYearRange } from '../lib/stockInventory';

export { FINANCIAL_YEARS, financialYearForDate, financialYearRange };

export function currentFinancialYear(): string {
  const current = financialYearForDate(currentReportDate());
  return FINANCIAL_YEARS.includes(current as (typeof FINANCIAL_YEARS)[number]) ? current : FINANCIAL_YEARS[1];
}

export function dateInFinancialYear(dateValue: string | undefined, financialYear: string): boolean {
  if (!dateValue) return false;
  const range = financialYearRange(financialYear);
  return dateValue >= range.start && dateValue <= range.end;
}
