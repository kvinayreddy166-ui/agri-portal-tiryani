import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const SimpleBarChart = React.memo(function SimpleBarChart({
  data,
  dataKey,
  nameKey,
  height = 260,
  minWidth = 420,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  nameKey: string;
  height?: number;
  minWidth?: number;
}) {
  const width = Math.max(minWidth, data.length * 72);
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
              dataKey={nameKey}
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-32}
              textAnchor="end"
              height={78}
              tickFormatter={truncate}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill="#166534" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
