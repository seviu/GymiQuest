import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["fake-indexeddb/auto"],
    exclude: [...configDefaults.exclude, "e2e/**"],
    // 1,000-seed property sweeps legitimately exceed 5s under parallel CPU
    // contention (mockExam hit 33s under full-suite load); 60s gives headroom.
    testTimeout: 60_000,
  },
})
