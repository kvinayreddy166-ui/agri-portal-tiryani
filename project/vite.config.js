import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const buildTimestamp = process.env.VITE_APP_BUILD_TIMESTAMP || new Date().toISOString();

export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_BUILD_TIMESTAMP': JSON.stringify(buildTimestamp),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version + '-' + buildTimestamp),
  },
  esbuild: {
    legalComments: 'none',
    drop: ['debugger'],
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
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => {
          // Keep PDF and chart modules preloaded for mobile compatibility
          if (/(office|html2canvas|purify|tensorflow|vendor-xlsx)/.test(dep)) {
            return false;
          }
          if (/page-(?!dashboard)/.test(dep)) {
            return false;
          }
          return true;
        }),
    },
    assetsInlineLimit: 2048,
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2020',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // Add hash to chunk filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('commonjsHelpers')) {
            return 'vendor-commonjs';
          }
          // Group PDF libraries together for better mobile loading
          if (id.includes('jspdf') || id.includes('pdfjs-dist') || id.includes('pdf-lib')) {
            return 'vendor-pdf';
          }
          // Group Excel library separately
          if (id.includes('xlsx')) {
            return 'vendor-xlsx';
          }
          // Group React libraries
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor-react';
          }
          // Group chart libraries
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
          // Group Supabase libraries
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // Group TensorFlow separately (lazy loaded)
          if (id.includes('@tensorflow')) {
            return 'vendor-tensorflow';
          }
          // Group document processing libraries
          if (id.includes('docx') || id.includes('html2canvas') || id.includes('mammoth')) {
            return 'vendor-docs';
          }
          return undefined;
        },
      },
    },
  },
});
