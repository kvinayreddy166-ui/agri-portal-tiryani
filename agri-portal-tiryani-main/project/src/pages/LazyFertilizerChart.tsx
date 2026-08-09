import React from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface FertilizerChartProps {
  data: Array<{ fertilizer: string; Receipts: number }>;
}

export default function FertilizerChart({ data }: FertilizerChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    Receipts: Number(item.Receipts || 0),
  }));
  const maxValue = Math.max(...chartData.map((item) => item.Receipts), 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 46, left: 16, bottom: 8 }}
        barCategoryGap={12}
      >
        <defs>
          <linearGradient id="fertilizerReceiptsGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis
          type="number"
          domain={[0, Math.ceil(maxValue * 1.12) || 1]}
          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
          tickFormatter={(value) => `${Number(value).toLocaleString('en-IN')}`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="fertilizer"
          width={96}
          tick={{ fontSize: 11, fill: '#334155', fontWeight: 800 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          formatter={(value) => [`${Number(value ?? 0).toFixed(2)} MT`, 'Receipts']}
          labelStyle={{ color: '#0f172a', fontWeight: 900 }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
            fontSize: 12,
            fontWeight: 700,
          }}
        />
        <Bar dataKey="Receipts" fill="url(#fertilizerReceiptsGradient)" radius={[0, 8, 8, 0]} barSize={18}>
          <LabelList
            dataKey="Receipts"
            position="right"
            formatter={(value: number) => `${Number(value || 0).toFixed(2)}`}
            style={{ fill: '#0f172a', fontSize: 11, fontWeight: 900 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
