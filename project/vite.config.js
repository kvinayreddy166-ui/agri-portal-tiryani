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
          if (/(charts|office|pdf|html2canvas|purify|three|tensorflow|vendor-xlsx|vendor-pdf)/.test(dep)) {
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
        manualChunks(id) {
          if (id.includes('commonjsHelpers')) {
            return 'vendor-commonjs';
          }
          return undefined;
        },
      },
    },
  },
});
