import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          office: ['xlsx'],
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
