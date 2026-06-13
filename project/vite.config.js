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
    assetsInlineLimit: 2048,
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('xlsx')) return 'office-xlsx';
          if (id.includes('jspdf') || id.includes('pdf-lib') || id.includes('pdfjs-dist') || id.includes('html2canvas')) {
            return 'pdf-tools';
          }
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          return undefined;
        },
      },
    },
  },
});
