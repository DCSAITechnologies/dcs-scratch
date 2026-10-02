import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { catalogueSummary } from "./scripts/catalogue-summary-plugin"

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [catalogueSummary(__dirname), react()],
  build: {
    rollupOptions: {
      output: {
        // the two catalogue datasets change independently of code; separate chunks
        // keep them cacheable across deploys and out of route chunks
        manualChunks(id) {
          if (id.endsWith('connectors-legacy.json')) return 'catalogue-legacy'
          if (id.endsWith('connectors.json')) return 'catalogue'
        },
      },
    },
    // the canonical catalogue JSON (~1.5 MB raw, ~110 KB gzip) is one chunk by design
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
