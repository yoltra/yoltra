import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "src",
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        devtools: resolve(__dirname, "src/devtools.html"),
        panel: resolve(__dirname, "src/panel.html"),
        popup: resolve(__dirname, "src/popup.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    sourcemap: false,
    minify: true,
    // The extension panel bundles the full devtools UI, so a large single chunk
    // is expected. Raise Vite's advisory threshold — Rush treats build warnings
    // as failures and this bundle-size advisory is not actionable here.
    chunkSizeWarningLimit: 2000,
    emptyOutDir: true,
    copyPublicDir: true,
  },
  publicDir: resolve(__dirname, "public"),
});
