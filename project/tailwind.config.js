/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-[#eef6f0]', 'bg-emerald-700', 'bg-emerald-800', 'bg-emerald-50', 'bg-slate-950',
    'bg-white', 'bg-white/90', 'bg-white/95', 'text-slate-600', 'text-slate-400',
    'text-slate-300', 'text-slate-950', 'text-slate-500', 'text-white', 'text-emerald-800',
    'text-red-700', 'text-red-300', 'border-emerald-200', 'border-red-200', 'border-red-900',
    'border-amber-200', 'border-amber-900', 'shadow-sm', 'rounded-2xl', 'rounded-xl',
    'hover:bg-emerald-800', 'hover:bg-emerald-50',
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          primary: '#0B7A5C',
          secondary: '#0F9D58',
          blue: '#2563EB',
          danger: '#DC2626',
          warning: '#F59E0B',
          bg: '#F4F8F5',
          card: '#FFFFFF',
          text: '#0F172A',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Atkinson Hyperlegible Next', 'Noto Sans Telugu', 'Nirmala UI', 'Gautami', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Atkinson Hyperlegible Next', 'Noto Sans Telugu', 'Nirmala UI', 'Gautami', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Atkinson Hyperlegible Next', 'Noto Sans Telugu', 'Nirmala UI', 'Gautami', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(15,23,42,0.08)',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
