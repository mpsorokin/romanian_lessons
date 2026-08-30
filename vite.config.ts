import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { contentIndexPlugin } from "./scripts/vite-content-index.mjs";

// Single source of truth for the version shown in Settings; bumped by the commit-msg hook.
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    outDir: "dist/client",
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // React first: it is shared between the entry and every lazy route, so
            // without its own group it lands inside `markdown` and drags the whole
            // markdown pipeline into the entry's static imports — exactly what the
            // split below is meant to prevent.
            {
              name: "react",
              test: /node_modules[/\\](react|react-dom|scheduler)[/\\]/,
            },
            {
              name: "markdown",
              test: /node_modules[/\\](react-markdown|remark-|rehype-|micromark|mdast-|unist-|unified|vfile|bail|is-plain|devlop|trough|property-information|space-separated-tokens|comma-separated-tokens|hast-|estree-|character-entities)/,
            },
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client", "@phosphor-icons/react", "i18next", "react-i18next"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  plugins: [react(), tailwindcss(), contentIndexPlugin()],
  base: "./",
});
