import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const CHART_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const CHART_DURATION = 600;

function usePrefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface StockChartProps {
  data: Array<{ product: string; Total: number; Sales: number; Closing: number }>;
}

export default function StockChart({ data }: StockChartProps) {
  const reduceMotion = usePrefersReducedMotion();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="product" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={46} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
        <Bar dataKey="Total" fill="#2563eb" radius={[5, 5, 0, 0]} isAnimationActive={!reduceMotion} animationDuration={CHART_DURATION} animationEasing={CHART_EASE} />
        <Bar dataKey="Sales" fill="#f59e0b" radius={[5, 5, 0, 0]} isAnimationActive={!reduceMotion} animationDuration={CHART_DURATION} animationEasing={CHART_EASE} />
        <Bar dataKey="Closing" fill="#166534" radius={[5, 5, 0, 0]} isAnimationActive={!reduceMotion} animationDuration={CHART_DURATION} animationEasing={CHART_EASE} />
      </BarChart>
    </ResponsiveContainer>
  );
}
