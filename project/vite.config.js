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
          
          // Office/Excel
          if (id.includes('xlsx')) return 'vendor-xlsx';
          
          // PDF tools
          if (id.includes('jspdf') || id.includes('pdf-lib') || id.includes('pdfjs-dist') || id.includes('html2canvas')) {
            return 'vendor-pdf';
          }
          
          // Charts
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          
          // React vendor
          if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
            return 'vendor-react';
          }
          
          // Supabase
          if (id.includes('@supabase')) return 'vendor-supabase';
          
          // Router
          if (id.includes('react-router')) return 'vendor-router';
          
          // Icons
          if (id.includes('lucide-react')) return 'vendor-icons';
          
          return undefined;
        },
      },
    },
  },
});
