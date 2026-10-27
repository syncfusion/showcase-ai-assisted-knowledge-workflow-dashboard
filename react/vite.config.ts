import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: '/ai-assisted-knowledge-workflow/react/',
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          sfCharts: ["@syncfusion/ej2-charts"],
          sfGrid: ["@syncfusion/ej2-grids"],
          sfSchedule: ["@syncfusion/ej2-schedule"],
          sfInputs: [
            "@syncfusion/ej2-inputs",
            "@syncfusion/ej2-dropdowns",
            "@syncfusion/ej2-navigations",
            "@syncfusion/ej2-popups",
          ],
          sfRte: ["@syncfusion/ej2-richtexteditor"],
        },
      },
    },
  },
  // The shell checks mount the real Syncfusion components, so they need a DOM.
  test: {
    environment: "jsdom",
    globals: false,
  },
});