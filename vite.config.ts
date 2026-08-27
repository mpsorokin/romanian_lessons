import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { contentIndexPlugin } from "./scripts/vite-content-index.mjs";

// Single source of truth for the version shown in Settings; bumped by the commit-msg hook.
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client", "@phosphor-icons/react"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  plugins: [react(), contentIndexPlugin()],
  base: "./",
});
