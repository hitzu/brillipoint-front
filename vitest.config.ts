import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  // Override Next.js JSX preservation for the test transform.
  oxc: { jsx: "automatic" },
  resolve: {
    alias: {
      "@pages": r("src/pages"),
      "@assets": r("src/assets"),
      "@layout": r("src/Layouts"),
      "@common": r("src/Common"),
      "@shared": r("src/shared"),
      "@data": r("src/Common/JsonData"),
      "@slices": r("src/slices"),
      "@views": r("src/views"),
      "@helpers": r("src/helpers"),
    },
  },
  test: {
    // Default to node so pure-logic tests run without a DOM dependency.
    // Component/render tests opt into jsdom per-file via:
    //   // @vitest-environment jsdom
    environment: "node",
    setupFiles: [r("src/test/setup.ts")],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // party/* keeps its existing node:test runner (npm run test:party).
    exclude: ["node_modules", ".next", "src/features/party/**"],
  },
});
