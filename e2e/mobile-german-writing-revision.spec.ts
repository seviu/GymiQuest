import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import type { GermanCourseState } from "../src/subjects/german/courseState"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

async function readGermanCourse(page: Page): Promise<GermanCourseState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const state = await new Promise<GermanCourseState>((resolve, reject) => {
      const request = database.transaction("learner", "readonly")
        .objectStore("learner")
        .get("zh-zap1-german@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return state
  })
}

async function reachGermanHome(page: Page): Promise<void> {
  await page.goto("/")
  await page.getByLabel("Dein Spitzname").fill("Mia")
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()
  const mobileSubjectSelect = page.locator(".subject-mobile-select select")
  if (await mobileSubjectSelect.isVisible()) {
    await mobileSubjectSelect.selectOption("german")
  } else {
    await page.getByRole("button", { name: "Deutsch", exact: true }).click()
  }
  await page.getByRole("button", { name: "Deutsch-Start-Check beginnen" }).click()
  for (let question = 0; question < 5; question += 1) {
    await page.locator(".german-answer-options button").first().click()
    await page.getByRole("button", { name: "Antwort speichern" }).click()
  }
  await expect(page.getByRole("heading", { name: "Dein Deutsch-Lernplan" })).toBeVisible()
}

test("completes and resumes a no-score writing revision in mobile WebKit", async ({ page }, testInfo) => {
  test.skip(
    !["webkit-iphone", "webkit-ipad"].includes(testInfo.project.name),
    "This is the dedicated iPhone and iPad WebKit regression.",
  )
  test.setTimeout(90_000)
  await reachGermanHome(page)
  const baseline = await readGermanCourse(page)

  await page.getByRole("button", { name: "Schreibwerkstatt öffnen" }).click()
  await page.getByRole("button", { name: "60-Minuten-Schreibzeit starten" }).click()
  await page.locator(".german-writing-prompt-grid article").first().getByRole("button", {
    name: "Dieses Thema wählen",
  }).click()
  await page.locator(".german-writing-stage-nav").getByRole("button", { name: "Text" }).click()
  await page.getByLabel("Titel", { exact: true }).fill("Das vertauschte Paket")
  const originalDraft = "Mia öffnete das Paket. Im Innern lag ein fremder Schlüssel, der alles veränderte."
  await page.getByLabel("Dein Text").fill(originalDraft)
  await page.locator(".german-writing-stage-nav").getByRole("button", { name: "Prüfen" }).click()
  await page.getByRole("button", { name: "Text abgeben" }).click()
  await page.getByRole("button", { name: "Text endgültig abgeben" }).click()
  await expect(page.getByRole("heading", { name: "Bereit für menschliche Rückmeldung" })).toBeVisible()
  await page.getByRole("button", { name: "Zum Deutsch-Lernplan" }).click()

  await page.getByRole("button", { name: "Begleitansicht", exact: true }).click()
  await page.locator("#parent-pin").fill("4826")
  await page.locator("#parent-pin-confirmation").fill("4826")
  await page.getByRole("button", { name: "PIN speichern und öffnen" }).click()
  const reviewCard = page.locator(".german-writing-review-item")
  await expect(reviewCard).toBeVisible()
  await reviewCard.locator("textarea").nth(0).fill("Der Einstieg weckt sofort Interesse.")
  await reviewCard.locator("textarea").nth(1).fill("Zeige die Folge des Konflikts genauer.")
  await reviewCard.getByRole("button", { name: "Menschliche Rückmeldung speichern" }).click()

  await page.goto("/")
  await page.getByRole("button", { name: "Letzten Text ansehen" }).click()
  await expect(page.getByText("Zeige die Folge des Konflikts genauer.")).toBeVisible()
  await page.getByRole("button", { name: "Text gezielt überarbeiten" }).click()
  const revisionShell = page.locator(".german-writing-revision-shell")
  await expect(revisionShell).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  expect(await revisionShell.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)
  const audit = await new AxeBuilder({ page }).include(".german-writing-revision-shell").withTags(wcagTags).analyze()
  expect(audit.violations, JSON.stringify(audit.violations, null, 2)).toEqual([])

  const revisionDraft = page.getByLabel("Überarbeitete Fassung")
  await expect(revisionDraft).toHaveValue(originalDraft)
  const revisedDraft = `${originalDraft} Danach sucht Mia die Besitzerin und versteht die Folgen ihrer Entscheidung.`
  await revisionDraft.fill(revisedDraft)
  await expect.poll(async () => (await readGermanCourse(page)).activeWritingRevision?.draft).toBe(revisedDraft)

  await page.reload()
  await expect(page.getByLabel("Überarbeitete Fassung")).toHaveValue(revisedDraft)
  const saveRevision = page.getByRole("button", { name: "Diese Fassung unveränderlich speichern" })
  await saveRevision.scrollIntoViewIfNeeded()
  await expect(saveRevision).toBeInViewport()
  await saveRevision.click()

  await expect(page.getByRole("heading", { name: "Gespeicherte Überarbeitungen" })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(page.getByText(revisedDraft)).toBeAttached()
  const completed = await readGermanCourse(page)
  expect(completed.activeWritingRevision).toBeUndefined()
  expect(completed.writingRevisions).toHaveLength(1)
  expect(completed.writingHistory[0]?.draft).toBe(originalDraft)
  expect(completed.totalXp).toBe(baseline.totalXp)
  expect(completed.xpSinceAssessment).toBe(baseline.xpSinceAssessment)
  expect(completed.topicProgress).toEqual(baseline.topicProgress)

  await page.getByRole("button", { name: "Zum Deutsch-Lernplan" }).click()
  await page.getByRole("button", { name: "Begleitansicht", exact: true }).click()
  await page.locator("#parent-pin").fill("4826")
  await page.getByRole("button", { name: "Begleitansicht öffnen" }).click()
  await expect(reviewCard).toBeVisible()
  await reviewCard.getByText("Text und Auftrag öffnen", { exact: true }).click()
  const companionRevisions = reviewCard.locator(".german-writing-companion-revisions")
  await expect(companionRevisions).toBeVisible()
  await expect(companionRevisions).toContainText(revisedDraft)
  await expect(reviewCard.locator("textarea").first()).toBeDisabled()
  await expect(reviewCard.getByText(
    "Die ursprüngliche Rückmeldung ist seit Beginn der Überarbeitung unveränderlich.",
  )).toBeVisible()
})
