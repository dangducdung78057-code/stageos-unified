import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["components/**/*.test.ts", "domain/**/*.test.ts", "lib/**/*.test.ts", "scripts/**/*.test.ts"],
    exclude: [".handoff/**", "imported-app/**", "node_modules/**"],
    environment: "node",
  },
});
