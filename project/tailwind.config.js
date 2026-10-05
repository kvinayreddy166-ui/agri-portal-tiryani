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
        // Brand remap: the app standardised on emerald-* classes; the emerald
        // scale is re-pointed to a deep leaf-green scale so every emerald
        // utility resolves to the AGRONIX primary family (#166534 at -800).
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        gold: {
          50: '#fbf6e9',
          100: '#f6ebcd',
          200: '#eed9a0',
          300: '#e5c166',
          400: '#deab3a',
          500: '#d89b18',
          600: '#b77f14',
          700: '#8f6113',
          800: '#6d4a12',
          900: '#4f350e',
        },
        agri: {
          primary: '#166534',
          secondary: '#15803D',
          accent: '#D89B18',
          blue: '#2563EB',
          danger: '#DC2626',
          warning: '#D89B18',
          bg: '#F2F7F3',
          card: '#FFFFFF',
          text: '#0F172A',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'Nirmala UI', 'Gautami', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'Noto Sans Telugu', 'Nirmala UI', 'Gautami', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Noto Sans Telugu', 'Nirmala UI', 'Gautami', 'system-ui', 'sans-serif'],
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
