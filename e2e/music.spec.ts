import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function futureZurichDate(): string {
  const future = new Date()
  future.setUTCFullYear(future.getUTCFullYear() + 1)
  return future.toISOString().slice(0, 10)
}

test("plays and pauses the original lightweight MIDI from the app header", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Dein Spitzname").fill("Musik-Test")
  await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()

  const musicButton = page.locator(".music-toggle")
  await expect(musicButton).toHaveAccessibleName("Musik abspielen: The Golden Dragon")
  const midiResponse = page.waitForResponse((response) => response.url().endsWith("/music/the-golden-dragon.mid"))
  await musicButton.click()
  const response = await midiResponse
  expect(response.ok()).toBe(true)
  const bytes = await response.body()
  expect(bytes.byteLength).toBe(43_402)
  expect([...bytes.subarray(0, 4)]).toEqual([0x4d, 0x54, 0x68, 0x64])

  await expect(musicButton).toHaveAttribute("aria-pressed", "true")
  await expect(musicButton).toHaveAttribute("data-music-status", "playing")
  await expect(musicButton).toHaveAccessibleName("Musik pausieren: The Golden Dragon")
  const audit = await new AxeBuilder({ page })
    .include(".music-toggle")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze()
  expect(audit.violations).toEqual([])

  await musicButton.click()
  await expect(musicButton).toHaveAttribute("aria-pressed", "false")
  await expect(musicButton).toHaveAttribute("data-music-status", "off")
  await expect(musicButton).toHaveAccessibleName("Musik abspielen: The Golden Dragon")
})
