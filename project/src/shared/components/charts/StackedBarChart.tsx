import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PALETTE = [
  '#166534', '#059669', '#0d9488', '#0284c7', '#4f46e5',
  '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#64748b',
];

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color?: string;
  fill?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

function StackedBarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  // Filter out any mandals with 0 dealers in this district.
  // This ensures mandals from other districts (e.g. Jagdevpur in Asifabad) are never displayed.
  const activeItems = payload.filter((item) => Number(item.value || 0) > 0);
  if (!activeItems.length) return null;

  const total = activeItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 min-w-[180px]">
      <div className="border-b border-slate-100 pb-1.5 mb-2 dark:border-slate-800">
        <p className="font-bold text-xs text-slate-900 dark:text-white">
          {label}
        </p>
      </div>
      <div className="space-y-1.5">
        {activeItems.map((item) => {
          const isOthers = item.dataKey === 'mOthers' || item.name.toLowerCase().includes('other');
          const detail = isOthers && item.payload?._otherMandalsDetail
            ? String(item.payload._otherMandalsDetail)
            : null;

          return (
            <div key={item.dataKey || item.name} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || item.fill }}
                  />
                  {item.name}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {item.value}
                </span>
              </div>
              {detail && (
                <span className="pl-3.5 text-[10px] text-slate-500 dark:text-slate-400">
                  ({detail})
                </span>
              )}
            </div>
          );
        })}
      </div>
      {activeItems.length > 1 && (
        <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <span>Total</span>
          <span>{total}</span>
        </div>
      )}
    </div>
  );
}

export const StackedBarChart = React.memo(function StackedBarChart({
  data,
  xKey,
  bars,
  height = 280,
  minWidth = 480,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  bars: { key: string; label: string }[];
  height?: number;
  minWidth?: number;
}) {
  const width = Math.max(minWidth, data.length * 120);
  const truncate = (value: unknown) => {
    const text = String(value ?? '');
    return text.length > 18 ? `${text.slice(0, 17)}…` : text;
  };
  return (
    <div className="overflow-x-auto">
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-24}
              textAnchor="end"
              height={64}
              tickFormatter={truncate}
            />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }}
              content={<StackedBarTooltip />}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {bars.map((bar, i) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.label}
                stackId="dealers"
                fill={PALETTE[i % PALETTE.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
