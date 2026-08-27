import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { contentIndexPlugin } from "./scripts/vite-content-index.mjs";

export default defineConfig({
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
