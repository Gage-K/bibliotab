import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

import path from "path";

// The Tab document model (types, constants, normalize, validate) lives in the repo-root
// `shared/` folder, which the server imports too. It sits beside the client in every
// layout: the repo on a host, `/shared` next to `/app` in the dev container (a mount),
// and `/app/shared` next to `/app/client` in the production build stage.
const sharedDir = path.resolve(__dirname, "../shared");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tablab/shared": path.join(sharedDir, "index.ts"),
    },
  },
  server: {
    host: true,
    port: 5173,
    // `shared/` is outside the client root, so the dev server must be allowed to serve it.
    fs: {
      allow: [__dirname, sharedDir],
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});
