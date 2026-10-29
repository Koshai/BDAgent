import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@bdagent/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "Dyotona",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
