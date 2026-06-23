import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Two projects:
//  - "convex": Convex functions tested via convex-test in the edge runtime.
//  - "unit":   pure logic + React components in jsdom.
// `@/` alias mirrors tsconfig paths so test files import like app code.
export default defineConfig({
  resolve: {
    alias: { "@": import.meta.dirname },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "convex",
          environment: "edge-runtime",
          include: ["convex/**/*.test.ts"],
          server: { deps: { inline: ["convex-test"] } },
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./test/setup-jsdom.ts"],
          include: [
            "lib/**/*.test.ts",
            "lib/**/*.test.tsx",
            "hooks/**/*.test.ts",
            "components/**/*.test.tsx",
          ],
        },
      },
    ],
  },
});
