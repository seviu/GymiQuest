import { expect, test } from "@playwright/test"

const cloudflarePreview = "http://127.0.0.1:8788"

test("Cloudflare Pages serves the app with the production security and cache policy", async ({ page, request }) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  const response = await page.goto(cloudflarePreview)
  expect(response?.ok()).toBe(true)
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'")
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'")
  expect(response?.headers()["x-frame-options"]).toBe("DENY")
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff")
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer")

  await expect(page.getByRole("heading", { name: "Für wen und bis wann planen wir?" })).toBeVisible()
  const privacyLink = page.getByRole("link", { name: "Datenschutz und lokale Daten öffnen" })
  await expect(privacyLink).toBeVisible()
  await expect(privacyLink).toHaveAttribute("href", "/datenschutz.html")
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  expect(pageErrors).toEqual([])

  const privacyResponse = await request.get(`${cloudflarePreview}/datenschutz.html`)
  expect(privacyResponse.ok()).toBe(true)
  expect(privacyResponse.headers()["content-security-policy"]).toContain("default-src 'self'")
  const privacyHtml = await privacyResponse.text()
  expect(privacyHtml).toContain("Dein Lernen bleibt auf deinem Gerät.")
  expect(privacyHtml).toContain("Was die App nicht überträgt")
  expect(privacyHtml).toContain("Technische Produktinformation")

  const modulePath = await page.locator('script[type="module"]').getAttribute("src")
  expect(modulePath).toMatch(/^\/assets\/.+\.js$/)
  const moduleResponse = await request.get(new URL(modulePath, cloudflarePreview).href)
  expect(moduleResponse.ok()).toBe(true)
  expect(moduleResponse.headers()["cache-control"]).toContain("max-age=31536000")
  expect(moduleResponse.headers()["cache-control"]).toContain("immutable")

  const serviceWorkerResponse = await request.get(`${cloudflarePreview}/sw.js`)
  expect(serviceWorkerResponse.ok()).toBe(true)
  expect(serviceWorkerResponse.headers()["cache-control"]).toContain("no-store")
})
