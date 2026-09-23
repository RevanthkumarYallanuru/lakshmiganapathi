import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Without this, Rollup's default chunking merges framer-motion
        // (used by Dialog/MobileNav) into whatever chunk happens to be
        // shared with the eagerly-mounted ToastProvider, inflating the
        // critical-path bundle that's modulepreloaded before any route
        // — including the login screen — even renders. Splitting
        // vendor code by library instead gives each one its own
        // chunk, so it's pulled in only where it's actually needed and
        // stays cacheable across app-code deploys.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("react-dom") || id.includes("/react-router") || id.includes("/react/")) {
            return "vendor-react";
          }
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("/zod/")) {
            return "vendor-forms";
          }
          if (id.includes("lucide-react")) return "vendor-icons";
          return undefined;
        },
      },
    },
  },
});
