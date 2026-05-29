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
    // TensorFlow is large; exclude from pre-bundle to avoid dev OOM on low-memory machines
    exclude: ['@tensorflow/tfjs'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          tensorflow: ['@tensorflow/tfjs'],
        },
      },
    },
  },
  server: {
    fs: {
      // OneDrive can serve placeholder files; relax strict fs checks for node_modules
      strict: false,
    },
  },
});
