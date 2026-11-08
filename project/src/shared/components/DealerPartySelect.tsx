import React, { useMemo, useState } from 'react';
import type { Dealer } from '../../types/database';

const MANUAL_VALUE = '__manual__';

interface DealerPartySelectProps {
  dealers: Dealer[];
  loading?: boolean;
  /** Called with the chosen dealer, or null when "manual entry" is picked. */
  onPick: (dealer: Dealer | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Dropdown to pick a dealer/party from the Dealers Directory.
 * Selecting "Other / manual entry" calls onPick(null) so the parent keeps
 * its existing free-text fields editable.
 */
export function DealerPartySelect({
  dealers,
  loading = false,
  onPick,
  label = 'SELECT DEALER / PARTY',
  placeholder = '— Select from Dealers Directory —',
  className = '',
}: DealerPartySelectProps) {
  const [value, setValue] = useState('');

  const sorted = useMemo(
    () => [...dealers].sort((a, b) => a.dealer_name.localeCompare(b.dealer_name)),
    [dealers]
  );

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    setValue(next);
    if (next === MANUAL_VALUE) {
      onPick(null);
    } else if (next) {
      const dealer = sorted.find((d) => d.id === next);
      if (dealer) onPick(dealer);
    }
  };

  return (
    <label className={`block ${className}`}>
      <span className="mb-0.5 block text-[11px] font-black tracking-wide text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <select
        value={value}
        onChange={handleChange}
        disabled={loading}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
      >
        <option value="">{loading ? 'Loading dealers…' : placeholder}</option>
        {sorted.map((dealer) => (
          <option key={dealer.id} value={dealer.id}>
            {dealer.dealer_name}
            {dealer.location ? ` — ${dealer.location}` : ''}
            {dealer.dealer_category ? ` (${dealer.dealer_category})` : ''}
          </option>
        ))}
        <option value={MANUAL_VALUE}>Other — enter details manually</option>
      </select>
    </label>
  );
}
