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
            <Tooltip />
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
