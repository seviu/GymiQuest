import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["fake-indexeddb/auto"],
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
})
