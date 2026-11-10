import React, { useMemo, useState } from 'react';
import { getDivisionsForDistrict } from '../../data/telanganaDistrictMandalData';

const DEFAULT_SELECT_CLASS =
  'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';
const DEFAULT_INPUT_CLASS =
  'mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';

type DivisionPickerProps = {
  /** Selected district value; 'Others' or empty yields no preset options. */
  district: string;
  /** Resolved division name (preset option or custom text). */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  selectClassName?: string;
  inputClassName?: string;
  inputPlaceholder?: string;
};

/**
 * District-filtered division dropdown with an "Others" manual entry.
 * Emits the resolved division name via onChange — preset option value or the
 * custom text typed under "Others". Values that don't match the district's
 * division list automatically render as "Others" with the text prefilled.
 */
export function DivisionPicker({
  district,
  value,
  onChange,
  label,
  disabled,
  selectClassName,
  inputClassName,
  inputPlaceholder = 'Enter division name',
}: DivisionPickerProps) {
  const [otherMode, setOtherMode] = useState(false);
  const options = useMemo(
    () => (district && district !== 'Others' ? getDivisionsForDistrict(district) : []),
    [district]
  );
  const isOther = otherMode || (value !== '' && !options.includes(value));

  return (
    <div className="block">
      {label ? (
        <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">{label}</span>
      ) : null}
      <select
        value={isOther ? 'Others' : value}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          if (next === 'Others') {
            setOtherMode(true);
            onChange('');
          } else {
            setOtherMode(false);
            onChange(next);
          }
        }}
        className={selectClassName ?? DEFAULT_SELECT_CLASS}
      >
        <option value="">Select</option>
        {options.map((division) => (
          <option key={division} value={division}>
            {division}
          </option>
        ))}
        <option value="Others">Others</option>
      </select>
      {isOther ? (
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={inputPlaceholder}
          className={inputClassName ?? DEFAULT_INPUT_CLASS}
        />
      ) : null}
    </div>
  );
}
