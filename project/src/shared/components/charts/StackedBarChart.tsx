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

export interface StackedSeries {
  key: string;
  label: string;
  fill: string;
}

export interface StackedBarDatum {
  name: string;
  [key: string]: string | number;
}

export const StackedBarChart = React.memo(function StackedBarChart({
  data,
  series,
  height = 260,
  minWidth = 420,
}: {
  data: StackedBarDatum[];
  series: StackedSeries[];
  height?: number;
  minWidth?: number;
}) {
  const width = Math.max(minWidth, data.length * 96);
  const truncate = (value: unknown) => {
    const text = String(value ?? '');
    return text.length > 16 ? `${text.slice(0, 15)}…` : text;
  };
  return (
    <div className="overflow-x-auto">
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-32}
              textAnchor="end"
              height={78}
              tickFormatter={truncate}
            />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(15,23,42,0.04)' }}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid rgba(15,23,42,0.1)',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="geo"
                fill={s.fill}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
