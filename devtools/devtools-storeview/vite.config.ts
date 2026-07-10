import { defineConfig, type Plugin } from "vite";
import dts from "vite-plugin-dts";

/**
 * Collects all extracted CSS from the Rollup bundle and injects it as a
 * self-executing runtime style tag inside every JS entry chunk.
 * This avoids the need for consumers to import a separate style.css.
 */
function cssInjectedByJs(): Plugin {
  return {
    name: "css-injected-by-js",
    apply: "build",
    // Run AFTER Vite's own `vite:css-post` plugin has emitted the extracted
    // CSS asset — otherwise `generateBundle` sees no `.css` in the bundle, the
    // injection is skipped, and consumers get a component with no styles.
    enforce: "post",
    generateBundle(_, bundle) {
      let css = "";
      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type === "asset" && name.endsWith(".css")) {
          css += chunk.source as string;
          delete bundle[name];
        }
      }
      if (!css) return;
      const injection = `(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s);})();\n`;
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) {
          chunk.code = injection + chunk.code;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src/"],
      exclude: ["src/**/*.test.ts"],
    }),
    cssInjectedByJs(),
  ],
  build: {
    lib: {
      entry: "src/index.tsx",
      name: "yoltraDevtoolsStoreview",
      formats: ["cjs", "es"],
      fileName: (format) =>
        format === "cjs" ? "devtools-storeview.cjs.js" : "devtools-storeview.esm.js",
    },
    rollupOptions: {
      // Externalize React and its subpath entrypoints (react-dom/client,
      // react/jsx-runtime, …). Matching only the bare specifiers would bundle
      // the entire react-dom reconciler via `react-dom/client`.
      external: [/^react(\/|$)/, /^react-dom(\/|$)/, /^@yoltra\//],
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true,
    // Inline assets (e.g. the brand logo) as data URIs so the library has no
    // separate asset files to resolve when consumed from `dist/`.
    assetsInlineLimit: 16384,
  },
});
