import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const PALETTE = [
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#e11d48', // rose-600
  '#0891b2', // cyan-600
  '#65a30d', // lime-600
  '#ea580c', // orange-600
  '#db2777', // pink-600
  '#0d9488', // teal-600
  '#4f46e5', // indigo-600
  '#64748b', // slate-500
];

export interface DonutDatum {
  name: string;
  count: number;
}

export const CategoryDonutChart = React.memo(function CategoryDonutChart({
  data,
  centerLabel,
}: {
  data: DonutDatum[];
  centerLabel?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length] }));

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-52 w-52 shrink-0 sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              innerRadius="60%"
              outerRadius="88%"
              paddingAngle={3}
              cornerRadius={6}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${Number(value ?? 0)} officers`, String(name ?? '')]}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid rgba(15,23,42,0.1)',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
            {total.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {centerLabel ?? 'Total'}
          </span>
        </div>
      </div>

      <ul className="grid flex-1 grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-1">
        {chartData.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.fill }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {entry.name}
            </span>
            <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
