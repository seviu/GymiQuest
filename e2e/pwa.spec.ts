import { expect, test, type Page } from "@playwright/test"
import { preview, type PreviewServer } from "vite"

function futureZurichDate() {
  const future = new Date()
  future.setUTCFullYear(future.getUTCFullYear() + 1)
  return future.toISOString().slice(0, 10)
}

async function stopPreview(server: PreviewServer) {
  if (!server.httpServer.listening) return

  await new Promise<void>((resolve, reject) => {
    server.httpServer.close((error) => {
      if (error) reject(error)
      else resolve()
    })
    server.httpServer.closeAllConnections?.()
  })
}

async function createFoundationsLearner(page: Page, name: string) {
  await page.goto("/")
  await page.getByLabel("Dein Spitzname").fill(name)
  await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
}

test("publishes the install contract without horizontal overflow", async ({ page, request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest")
  expect(manifestResponse.ok()).toBe(true)

  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "en",
  })
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: "/gymiquest-icon-192.png", sizes: "192x192", purpose: "any" }),
    expect.objectContaining({ src: "/gymiquest-icon-512.png", sizes: "512x512", purpose: "any" }),
    expect.objectContaining({ src: "/gymiquest-maskable-512.png", sizes: "512x512", purpose: "maskable" }),
  ]))

  await page.goto("/")
  await expect(page).toHaveTitle("GymiQuest")
  await expect(page.getByRole("heading", { name: "Für wen und bis wann planen wir?" })).toBeVisible()

  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))
  expect(overflow).toBeLessThanOrEqual(0)
})

test("keeps a saved learner plan after the production server disappears", async ({ page }) => {
  const learnerName = `Offline-${test.info().project.name}`
  const port = 4_300 + test.info().workerIndex
  const origin = `http://127.0.0.1:${port}`
  const previewServer = await preview({
    logLevel: "silent",
    preview: {
      host: "127.0.0.1",
      port,
      strictPort: true,
    },
  })
  let serverStopped = false

  try {
    await page.goto(origin)
    await page.getByLabel("Dein Spitzname").fill(learnerName)
    await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
    await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()

    await expect(page.getByRole("heading", { name: "Wie soll GymiQuest dich begleiten?" })).toBeVisible()
    await page.getByRole("button", { name: "Profil speichern und starten" }).click()
    await expect(page.getByRole("heading", { name: "Wir finden deinen besten Startpunkt." })).toBeVisible()

    await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()
    await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
    await expect(page.getByText(learnerName, { exact: true })).toBeVisible()

    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.reload()
    await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
    await expect(page.getByText(learnerName, { exact: true })).toBeVisible()
    expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

    await stopPreview(previewServer)
    serverStopped = true
    const serverReachable = await fetch(origin, { signal: AbortSignal.timeout(750) })
      .then(() => true)
      .catch(() => false)
    expect(serverReachable).toBe(false)

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page).toHaveTitle("GymiQuest")
    await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
    await expect(page.getByText(learnerName, { exact: true })).toBeVisible()
  } finally {
    if (!serverStopped) await stopPreview(previewServer)
  }
})

test("persists a foreground practice pause without counting or exposing the problem", async ({ page }) => {
  await createFoundationsLearner(page, `Pause-${test.info().project.name}`)
  await page.getByRole("button", { name: "Starten", exact: true }).click()
  await page.getByRole("button", { name: "Jetzt üben", exact: true }).click()

  const answer = page.locator("#answer")
  await expect(answer).toBeVisible()
  await answer.fill("123")
  await page.getByRole("button", { name: "Pause", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Mach in Ruhe eine Pause." })).toBeVisible()
  await expect(answer).toBeHidden()
  const pausedTime = await page.locator(".timer-chip").innerText()
  await page.waitForTimeout(1_200)
  expect(await page.locator(".timer-chip").innerText()).toBe(pausedTime)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  )

  await page.reload()
  await expect(page.getByRole("heading", { name: "Mach in Ruhe eine Pause." })).toBeVisible()
  expect(await page.locator(".timer-chip").innerText()).toBe(pausedTime)
  await page.getByRole("button", { name: "Weiterlernen", exact: true }).click()
  await expect(answer).toHaveValue("123")
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible()
})
