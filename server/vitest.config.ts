import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the tsconfig `paths` entry so tests import the shared workspace the
      // same way src does. Without this vitest resolves @tablab/shared as a package.
      "@tablab/shared": path.resolve(__dirname, "../shared/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Runs before any module (and therefore before env.config.ts reads process.env).
    setupFiles: ["./tests/setup.ts"],
  },
});
