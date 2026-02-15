import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["packages/*/src/**/*.ts"],
    },
    reporters: ["default", "json"],
    outputFile: {
      json: "./test-results.json",
    },
  },
});
