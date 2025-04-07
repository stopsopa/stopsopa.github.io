import { defineConfig } from "vitest/config";

// https://vitest.dev/guide/#configuring-vitest
export default defineConfig({
  test: {
    // coverage: {
    //   provider: "istanbul", // or 'v8'
    // },
    globals: true,
    include: ["**/*.{unit,spec}.?(c|m)[jt]s?(x)"],
    exclude: [
      // https://vitest.dev/config/#exclude
      "**/node_modules/**",
      "jasmine/**",
    ],
  },
});
