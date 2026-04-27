import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Why this exists:
 * Vitest configuration keeps tests consistent and fast for this reference app.
 *
 * What Antara expects:
 * Nothing directly, but we mock Antara responses to validate integration logic safely.
 *
 * Alternatives:
 * Jest can be used instead of Vitest with equivalent mocking behavior.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
