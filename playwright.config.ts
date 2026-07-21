import { defineConfig } from "@playwright/test"

const baseURL = "http://127.0.0.1:4173"

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  expect: {
    timeout: 7_000,
  },
  use: {
    baseURL,
    locale: "de-CH",
    timezoneId: "Europe/Zurich",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm preview --host 127.0.0.1 --port 4173",
      url: baseURL,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "wrangler pages dev dist --ip 127.0.0.1 --port 8788 --log-level error --show-interactive-dev-session=false",
      url: "http://127.0.0.1:8788",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "firefox",
      use: {
        browserName: "firefox",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "webkit-ipad",
      use: {
        browserName: "webkit",
        viewport: { width: 1180, height: 820 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "webkit-iphone",
      testMatch: /mobile-german-writing-revision\.spec\.ts/u,
      use: {
        browserName: "webkit",
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
})
