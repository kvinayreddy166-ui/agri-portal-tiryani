/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
