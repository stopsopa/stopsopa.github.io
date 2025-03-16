import { defineConfig } from "vitest/config";

// https://vitest.dev/guide/#configuring-vitest
export default defineConfig({
  test: {
    // coverage: {
    //   provider: "istanbul", // or 'v8'
    // },
    globals: true,
    exclude: [
      // https://vitest.dev/config/#exclude
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",

      "pages/node/builtin-test-runner.test.ts",
    ],
  },
});
