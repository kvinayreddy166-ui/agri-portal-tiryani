import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    legalComments: 'none',
  },
  modulePreload: {
    polyfill: false,
    resolveDependencies: (_filename, deps) =>
      deps.filter((dep) => !/(charts|office|pdf|html2canvas|purify|three|tensorflow)/.test(dep)),
  },
  optimizeDeps: {
    include: [
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      '@supabase/auth-js',
      '@supabase/realtime-js',
      '@supabase/storage-js',
      '@supabase/functions-js',
    ],
    exclude: ['@tensorflow/tfjs'],
  },
  build: {
    cssCodeSplit: true,
    target: 'es2020',
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          office: ['xlsx'],
          pdf: ['jspdf'],
        },
      },
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
