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

export function SimpleBarChart({
  data,
  dataKey,
  nameKey,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  nameKey: string;
}) {
  const width = Math.max(420, data.length * 64);
  return (
    <div className="overflow-x-auto">
      <div style={{ width, height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={64} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill="#0b7a5c" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
