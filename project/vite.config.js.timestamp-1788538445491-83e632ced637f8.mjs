// vite.config.js
import { defineConfig } from "file:///G:/agri-portal-tiryani/project/node_modules/vite/dist/node/index.js";
import react from "file:///G:/agri-portal-tiryani/project/node_modules/@vitejs/plugin-react/dist/index.js";
import { readFileSync } from "node:fs";
var __vite_injected_original_import_meta_url = "file:///G:/agri-portal-tiryani/project/vite.config.js";
var pkg = JSON.parse(readFileSync(new URL("./package.json", __vite_injected_original_import_meta_url), "utf8"));
var buildTimestamp = process.env.VITE_APP_BUILD_TIMESTAMP || (/* @__PURE__ */ new Date()).toISOString();
var vite_config_default = defineConfig({
  base: "/",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_APP_BUILD_TIMESTAMP": JSON.stringify(buildTimestamp),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version + "-" + buildTimestamp)
  },
  esbuild: {
    legalComments: "none",
    drop: ["debugger"]
  },
  optimizeDeps: {
    include: [
      "@supabase/supabase-js",
      "@supabase/postgrest-js",
      "@supabase/auth-js",
      "@supabase/realtime-js",
      "@supabase/storage-js",
      "@supabase/functions-js"
    ],
    exclude: ["@tensorflow/tfjs"]
  },
  build: {
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps) => deps.filter((dep) => {
        if (/(office|html2canvas|purify|tensorflow|vendor-xlsx)/.test(dep)) {
          return false;
        }
        if (/page-(?!dashboard)/.test(dep)) {
          return false;
        }
        return true;
      })
    },
    assetsInlineLimit: 2048,
    cssCodeSplit: true,
    minify: "esbuild",
    sourcemap: false,
    target: "es2020",
    reportCompressedSize: false,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // Add hash to chunk filenames for cache busting
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks(id) {
          if (id.includes("commonjsHelpers")) {
            return "vendor-commonjs";
          }
          if (id.includes("jspdf") || id.includes("pdfjs-dist") || id.includes("pdf-lib")) {
            return "vendor-pdf";
          }
          if (id.includes("xlsx")) {
            return "vendor-xlsx";
          }
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
            return "vendor-react";
          }
          if (id.includes("recharts")) {
            return "vendor-charts";
          }
          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("@tensorflow")) {
            return "vendor-tensorflow";
          }
          if (id.includes("docx") || id.includes("html2canvas") || id.includes("mammoth")) {
            return "vendor-docs";
          }
          return void 0;
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJHOlxcXFxhZ3JpLXBvcnRhbC10aXJ5YW5pXFxcXHByb2plY3RcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkc6XFxcXGFncmktcG9ydGFsLXRpcnlhbmlcXFxccHJvamVjdFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRzovYWdyaS1wb3J0YWwtdGlyeWFuaS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xyXG5cclxuY29uc3QgcGtnID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMobmV3IFVSTCgnLi9wYWNrYWdlLmpzb24nLCBpbXBvcnQubWV0YS51cmwpLCAndXRmOCcpKTtcclxuY29uc3QgYnVpbGRUaW1lc3RhbXAgPSBwcm9jZXNzLmVudi5WSVRFX0FQUF9CVUlMRF9USU1FU1RBTVAgfHwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBiYXNlOiAnLycsXHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIGRlZmluZToge1xyXG4gICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0FQUF9CVUlMRF9USU1FU1RBTVAnOiBKU09OLnN0cmluZ2lmeShidWlsZFRpbWVzdGFtcCksXHJcbiAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBQX1ZFUlNJT04nOiBKU09OLnN0cmluZ2lmeShwa2cudmVyc2lvbiArICctJyArIGJ1aWxkVGltZXN0YW1wKSxcclxuICB9LFxyXG4gIGVzYnVpbGQ6IHtcclxuICAgIGxlZ2FsQ29tbWVudHM6ICdub25lJyxcclxuICAgIGRyb3A6IFsnZGVidWdnZXInXSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1xyXG4gICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcclxuICAgICAgJ0BzdXBhYmFzZS9wb3N0Z3Jlc3QtanMnLFxyXG4gICAgICAnQHN1cGFiYXNlL2F1dGgtanMnLFxyXG4gICAgICAnQHN1cGFiYXNlL3JlYWx0aW1lLWpzJyxcclxuICAgICAgJ0BzdXBhYmFzZS9zdG9yYWdlLWpzJyxcclxuICAgICAgJ0BzdXBhYmFzZS9mdW5jdGlvbnMtanMnLFxyXG4gICAgXSxcclxuICAgIGV4Y2x1ZGU6IFsnQHRlbnNvcmZsb3cvdGZqcyddLFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIG1vZHVsZVByZWxvYWQ6IHtcclxuICAgICAgcG9seWZpbGw6IGZhbHNlLFxyXG4gICAgICByZXNvbHZlRGVwZW5kZW5jaWVzOiAoX2ZpbGVuYW1lLCBkZXBzKSA9PlxyXG4gICAgICAgIGRlcHMuZmlsdGVyKChkZXApID0+IHtcclxuICAgICAgICAgIC8vIEtlZXAgUERGIGFuZCBjaGFydCBtb2R1bGVzIHByZWxvYWRlZCBmb3IgbW9iaWxlIGNvbXBhdGliaWxpdHlcclxuICAgICAgICAgIGlmICgvKG9mZmljZXxodG1sMmNhbnZhc3xwdXJpZnl8dGVuc29yZmxvd3x2ZW5kb3IteGxzeCkvLnRlc3QoZGVwKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoL3BhZ2UtKD8hZGFzaGJvYXJkKS8udGVzdChkZXApKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pLFxyXG4gICAgfSxcclxuICAgIGFzc2V0c0lubGluZUxpbWl0OiAyMDQ4LFxyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcclxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjUwLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBBZGQgaGFzaCB0byBjaHVuayBmaWxlbmFtZXMgZm9yIGNhY2hlIGJ1c3RpbmdcclxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJyxcclxuICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnY29tbW9uanNIZWxwZXJzJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItY29tbW9uanMnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gR3JvdXAgUERGIGxpYnJhcmllcyB0b2dldGhlciBmb3IgYmV0dGVyIG1vYmlsZSBsb2FkaW5nXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2pzcGRmJykgfHwgaWQuaW5jbHVkZXMoJ3BkZmpzLWRpc3QnKSB8fCBpZC5pbmNsdWRlcygncGRmLWxpYicpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXBkZic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBHcm91cCBFeGNlbCBsaWJyYXJ5IHNlcGFyYXRlbHlcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygneGxzeCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXhsc3gnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gR3JvdXAgUmVhY3QgbGlicmFyaWVzXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1yb3V0ZXInKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1yZWFjdCc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBHcm91cCBjaGFydCBsaWJyYXJpZXNcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVjaGFydHMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1jaGFydHMnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gR3JvdXAgU3VwYWJhc2UgbGlicmFyaWVzXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0BzdXBhYmFzZScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXN1cGFiYXNlJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEdyb3VwIFRlbnNvckZsb3cgc2VwYXJhdGVseSAobGF6eSBsb2FkZWQpXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0ZW5zb3JmbG93JykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItdGVuc29yZmxvdyc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBHcm91cCBkb2N1bWVudCBwcm9jZXNzaW5nIGxpYnJhcmllc1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdkb2N4JykgfHwgaWQuaW5jbHVkZXMoJ2h0bWwyY2FudmFzJykgfHwgaWQuaW5jbHVkZXMoJ21hbW1vdGgnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1kb2NzJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1IsU0FBUyxvQkFBb0I7QUFDL1MsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBRjRJLElBQU0sMkNBQTJDO0FBSTFOLElBQU0sTUFBTSxLQUFLLE1BQU0sYUFBYSxJQUFJLElBQUksa0JBQWtCLHdDQUFlLEdBQUcsTUFBTSxDQUFDO0FBQ3ZGLElBQU0saUJBQWlCLFFBQVEsSUFBSSw2QkFBNEIsb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFFdEYsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLEVBQ04sU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLDRDQUE0QyxLQUFLLFVBQVUsY0FBYztBQUFBLElBQ3pFLG9DQUFvQyxLQUFLLFVBQVUsSUFBSSxVQUFVLE1BQU0sY0FBYztBQUFBLEVBQ3ZGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxlQUFlO0FBQUEsSUFDZixNQUFNLENBQUMsVUFBVTtBQUFBLEVBQ25CO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUyxDQUFDLGtCQUFrQjtBQUFBLEVBQzlCO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsTUFDVixxQkFBcUIsQ0FBQyxXQUFXLFNBQy9CLEtBQUssT0FBTyxDQUFDLFFBQVE7QUFFbkIsWUFBSSxxREFBcUQsS0FBSyxHQUFHLEdBQUc7QUFDbEUsaUJBQU87QUFBQSxRQUNUO0FBQ0EsWUFBSSxxQkFBcUIsS0FBSyxHQUFHLEdBQUc7QUFDbEMsaUJBQU87QUFBQSxRQUNUO0FBQ0EsZUFBTztBQUFBLE1BQ1QsQ0FBQztBQUFBLElBQ0w7QUFBQSxJQUNBLG1CQUFtQjtBQUFBLElBQ25CLGNBQWM7QUFBQSxJQUNkLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLHNCQUFzQjtBQUFBLElBQ3RCLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBLFFBRU4sZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsYUFBYSxJQUFJO0FBQ2YsY0FBSSxHQUFHLFNBQVMsaUJBQWlCLEdBQUc7QUFDbEMsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxZQUFZLEtBQUssR0FBRyxTQUFTLFNBQVMsR0FBRztBQUMvRSxtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxNQUFNLEdBQUc7QUFDdkIsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLGNBQWMsR0FBRztBQUNuRixtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxVQUFVLEdBQUc7QUFDM0IsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsV0FBVyxHQUFHO0FBQzVCLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLGFBQWEsR0FBRztBQUM5QixtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxNQUFNLEtBQUssR0FBRyxTQUFTLGFBQWEsS0FBSyxHQUFHLFNBQVMsU0FBUyxHQUFHO0FBQy9FLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
