import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
const { VITE_REPORT_MODE } = process.env;

const reportConfig = {
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    brotliSize: false,
    rollupOptions: {
      inlineDynamicImports: true,
      output: {
        manualChunks: () => "everything.js"
      }
    }
  }
};

const appConfig = {
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
};

export default defineConfig(VITE_REPORT_MODE === "app" ? appConfig : reportConfig);
