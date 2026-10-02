import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  // .env files are gitignored, so a production build gets VITE_API_URL
  // only from the host's environment variables. If it's missing there,
  // src/api/client.ts falls back to http://localhost:5000 — a build that
  // deploys fine but can never reach the API ("Unable to connect" on
  // every page). Fail the build instead, with a message saying exactly
  // what to set, so a misconfigured deploy never goes live.
  if (command === "build") {
    const apiUrl = loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL;
    if (!apiUrl) {
      throw new Error(
        "VITE_API_URL is not set. Set it to the backend's public URL " +
          "(e.g. https://your-api.onrender.com) in the build environment."
      );
    }
    // On Netlify the site itself is served over https, so the browser
    // blocks any plain-http API call as mixed content — and a local
    // address can never be reached by a real visitor either.
    if (
      process.env.NETLIFY &&
      (!apiUrl.startsWith("https://") || /localhost|127\.0\.0\.1/.test(apiUrl))
    ) {
      throw new Error(
        `VITE_API_URL is "${apiUrl}" on a Netlify build — it must be the ` +
          "backend's public https URL (not http://, not a local address)."
      );
    }
  }

  return {
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
  };
});
