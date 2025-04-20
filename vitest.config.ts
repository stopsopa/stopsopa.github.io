import { defineConfig } from "vitest/config";

// https://vitest.dev/guide/#configuring-vitest
export default defineConfig({
  test: {
    name: 'test',
    environment: 'node', // that is actually default: 
    coverage: {
      // provider: "istanbul", // or 'v8'
      // provider: "v8",
      reporter: ["text", "html"],
      include: ["libs/**/*.{js,ts,jsx,tsx}"],
    },
    globals: true,
    include: ["**/*.{unit,spec}.?(c|m)[jt]s?(x)"],
    exclude: [
      // https://vitest.dev/config/#exclude
      "**/node_modules/**",
      "jasmine/**",
      "pages/encryptor/aes.jasmine.unit.js",
    ],
  },
});
