/**
 * Returns YYYY-MM-DD formatted date in Indian Standard Time (IST, UTC+5:30).
 * Prevents UTC date skew between 00:00 and 05:29 AM IST.
 */
export function localTodayDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
}
