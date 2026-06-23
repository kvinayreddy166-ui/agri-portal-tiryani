import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
          const normalizedId = id.replace(/\\/g, '/');
          if (id.includes('commonjsHelpers')) {
            return 'vendor-react';
          }

          if (normalizedId.includes('/src/pages/Dashboard')) return 'page-dashboard';
          if (normalizedId.includes('/src/pages/FarmerDatabase')) return 'page-farmer-database';
          if (normalizedId.includes('/src/features/fertilizerCalculator/')) return 'page-fertilizer-calculator';
          if (
            normalizedId.includes('/src/pages/DealerStockPortal') ||
            normalizedId.includes('/src/pages/StockAnalytics') ||
            normalizedId.includes('/src/pages/StockReceiptsSales') ||
            normalizedId.includes('/src/pages/StockInventory') ||
            normalizedId.includes('/src/pages/StockManagement') ||
            normalizedId.includes('/src/lib/stockInventory') ||
            normalizedId.includes('/src/lib/fertilizerStock') ||
            normalizedId.includes('/src/lib/dealerStockAllocation')
          ) {
            return 'page-stock-management';
          }
          if (normalizedId.includes('/src/pages/Analytics')) return 'page-analytics';
          if (
            normalizedId.includes('/src/pages/ExcelUploads') ||
            normalizedId.includes('/src/pages/FileDirectory')
          ) {
            return 'page-reports';
          }
          if (
            normalizedId.includes('/src/components/forms/FertilizerStatutoryPdfTool') ||
            normalizedId.includes('/src/lib/statutoryFertilizerPdf') ||
            normalizedId.includes('/src/pages/FormsDownloads') ||
            normalizedId.includes('/src/pages/GosCirculars')
          ) {
            return 'page-pdf-tools';
          }
          if (
            normalizedId.includes('/src/pages/OfficersToolkit') ||
            normalizedId.includes('/src/pages/AcreageCalculator') ||
            normalizedId.includes('/src/pages/FarmMechanization') ||
            normalizedId.includes('/src/pages/SubsidyTracking')
          ) {
            return 'page-officer-toolkit';
          }
          if (normalizedId.includes('/src/pages/admin/') || normalizedId.includes('/src/services/cropService')) {
            return 'page-crop-admin';
          }

          if (!id.includes('node_modules')) return undefined;
          
          // Office/Excel
          if (id.includes('xlsx')) return 'vendor-xlsx';
          
          // PDF and document tools
          if (
            id.includes('jspdf') ||
            id.includes('pdf-lib') ||
            id.includes('pdfjs-dist') ||
            id.includes('html2canvas') ||
            id.includes('mammoth') ||
            id.includes('docx') ||
            id.includes('file-saver')
          ) {
            return 'vendor-pdf';
          }

          // AI / image processing modules are loaded only from specialist tools.
          if (id.includes('@tensorflow') || id.includes('@techstark/opencv-js') || id.includes('tesseract.js')) {
            return 'vendor-ai';
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
