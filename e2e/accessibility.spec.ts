import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

function futureZurichDate(): string {
  const future = new Date()
  future.setUTCFullYear(future.getUTCFullYear() + 1)
  return future.toISOString().slice(0, 10)
}

function violationSummary(
  context: string,
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
): string {
  const details = violations.map((violation) => {
    const targets = violation.nodes
      .flatMap((node) => node.target.map((target) => String(target)))
      .join(", ")
    return `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help} [${targets}]`
  })
  return [`Accessibility violations on ${context}:`, ...details].join("\n")
}

async function expectNoWcagViolations(page: Page, context: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(wcagTags)
    .analyze()

  expect(results.violations.length, violationSummary(context, results.violations)).toBe(0)
}

async function expectNoHorizontalOverflow(page: Page, context: string): Promise<void> {
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))
  expect(overflow, `${context} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0)
}

async function completeProfile(page: Page, name: string): Promise<void> {
  await page.getByLabel("Dein Spitzname").fill(name)
  await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
}

async function createFoundationsLearner(page: Page, name: string): Promise<void> {
  await page.goto("/")
  await completeProfile(page, name)
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
}

async function seedCheckpointRecovery(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learner = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = database.transaction("learner", "readonly").objectStore("learner").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result as Record<string, unknown>)
      request.onerror = () => reject(request.error)
    })
    const completedAt = new Date(Date.now() - 60_000).toISOString()
    const mastery = learner.mastery as Record<string, Record<string, unknown>>
    mastery["mass-units"] = {
      ...mastery["mass-units"],
      status: "mastered",
      masteredAt: completedAt,
      dueAt: completedAt,
      retention: 0.4,
      reviewIteration: 1,
    }
    const learningEvents = learner.learningEvents as unknown[]
    learningEvents.push({
      id: "event:assessment:browser-checkpoint",
      taskId: "assessment:1",
      taskKind: "assessment",
      topicIds: ["mass-units"],
      completedAt,
      activeSeconds: 180,
      mistakes: 1,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: [{
        questionId: "assessment:1:mass-units",
        topicId: "mass-units",
        attempts: 2,
        hintsUsed: 0,
        activeSeconds: 180,
        independentlySolved: false,
      }],
    })
    const completedTaskIds = learner.completedTaskIds as string[]
    completedTaskIds.push("assessment:1")
    learner.totalXp = 150
    learner.xpSinceAssessment = 0
    learner.assessmentNumber = 2
    learner.updatedAt = completedAt
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("learner", "readwrite")
      transaction.objectStore("learner").put(learner, "zh-zap1-math@1")
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
  })
  await page.reload()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
}

async function openAuthorValidationLab(page: Page, name: string): Promise<void> {
  await createFoundationsLearner(page, name)
  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()
  await page.getByRole("button", { name: "Begleitansicht öffnen" }).click()
  await page.locator("#parent-pin").fill("4826")
  await page.locator("#parent-pin-confirmation").fill("4826")
  await page.getByRole("button", { name: "PIN speichern und öffnen" }).click()
  await page.getByRole("button", { name: "Prüflabor öffnen" }).click()
  await expect(page.getByRole("heading", { name: "Frische Aufgaben prüfen, bevor sie Vertrauen kosten." })).toBeVisible()
}

test("keeps onboarding and the diagnostic choice WCAG A/AA clean", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Für wen und bis wann planen wir?" })).toBeVisible()
  await expectNoWcagViolations(page, "profile step 1")

  await page.getByLabel("Dein Spitzname").fill(`A11y-${test.info().project.name}`)
  await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await expect(page.getByRole("heading", { name: "Wie soll GymiQuest dich begleiten?" })).toBeVisible()
  await expectNoWcagViolations(page, "profile step 2")

  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await expect(page.getByRole("heading", { name: "Wir finden deinen besten Startpunkt." })).toBeVisible()
  await expectNoWcagViolations(page, "diagnostic choice")
})

test("keeps the learning plan and progress dashboard WCAG A/AA clean", async ({ page }) => {
  await createFoundationsLearner(page, `A11y-Plan-${test.info().project.name}`)
  await expectNoWcagViolations(page, "learning plan")

  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()
  await expect(page.getByRole("heading", { name: "Du baust Wissen auf, das bleibt." })).toBeVisible()
  await expectNoWcagViolations(page, "progress dashboard")
})

test("keeps the checkpoint return trail actionable and WCAG A/AA clean", async ({ page }) => {
  await createFoundationsLearner(page, `A11y-Checkpoint-${test.info().project.name}`)
  await seedCheckpointRecovery(page)

  await expect(page.getByText("RÜCKWEG AUS CHECK 1")).toBeVisible()
  await expect(page.getByRole("button", { name: "Nächsten Rückweg starten" })).toHaveCount(1)
  await expectNoHorizontalOverflow(page, "checkpoint return trail")
  await expectNoWcagViolations(page, "checkpoint return trail")

  await page.locator(".checkpoint-context > summary").click()
  await expect(page.getByRole("heading", { name: "Aus dem Check wird ein klarer Rückweg." })).toBeVisible()
  await expectNoWcagViolations(page, "expanded checkpoint return context")

  await page.getByRole("button", { name: "Nächsten Rückweg starten" }).click()
  await expect(page.locator(".question-card")).toBeVisible()
  await expectNoWcagViolations(page, "checkpoint return review")
})

test("keeps lesson introduction and active practice WCAG A/AA clean", async ({ page }) => {
  await createFoundationsLearner(page, `A11y-Lesson-${test.info().project.name}`)
  await page.getByRole("button", { name: "Starten", exact: true }).click()
  await expectNoWcagViolations(page, "lesson introduction")

  await page.getByRole("button", { name: "Jetzt üben", exact: true }).click()
  await expect(page.locator("#answer")).toBeVisible()
  await expectNoWcagViolations(page, "active practice")

  await page.setViewportSize({ width: 320, height: 800 })
  await page.locator(".help-panel > summary").click()
  await page.locator(".question-secondary-actions > summary").click()
  await expectNoHorizontalOverflow(page, "expanded question tools at 320px")
  await expectNoWcagViolations(page, "expanded question tools at 320px")

  await page.getByRole("button", { name: "Schritt für Schritt" }).click()
  await page.getByRole("button", { name: "Verstanden, mit Lösung weiter" }).click()
  await expect(page.getByText("Aufgabe 2 von 3")).toBeVisible()
  await expect(page.locator(".question-card h1")).toBeFocused()
  await expect(page.locator(".help-panel")).not.toHaveAttribute("open", "")
  await expect(page.locator(".question-secondary-actions")).not.toHaveAttribute("open", "")
})

test("keeps concept, exam, and parent entry surfaces WCAG A/AA clean", async ({ page }) => {
  await createFoundationsLearner(page, `A11y-Routes-${test.info().project.name}`)

  await page.getByRole("button", { name: "Fächerlabor öffnen" }).click()
  await page.getByRole("button", { name: "Mathematik-Konzeptlabor öffnen" }).click()
  await expect(page.getByRole("heading", { name: "Wenn etwas noch nicht klickt, nimm die Idee auseinander." })).toBeVisible()
  await expectNoWcagViolations(page, "concept library")

  await page.getByRole("button", { name: "Lernplan", exact: true }).click()
  await page.getByRole("button", { name: "Prüfungsmodus öffnen" }).click()
  await expect(page.getByRole("heading", { name: "Eine echte Stunde. Neue Aufgaben. Keine Hilfe währenddessen." })).toBeVisible()
  await expectNoWcagViolations(page, "mock exam setup")

  await page.getByRole("button", { name: "Lernplan", exact: true }).click()
  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()
  await page.getByRole("button", { name: "Begleitansicht öffnen" }).click()
  await expect(page.getByRole("heading", { name: "Ruhige Begleitung, getrennt vom Lernmodus." })).toBeVisible()
  await expectNoWcagViolations(page, "parent PIN setup")
})

test("persists spacious reading and a left-handed geometry workspace", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Dein Spitzname").fill(`A11y-Comfort-${test.info().project.name}`)
  await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await page.getByRole("button", { name: /^Mehr Leseruhe/u }).click()
  await page.getByRole("button", { name: /^Werkzeuge links/u }).click()
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()

  const root = page.locator("html")
  await expect(root).toHaveAttribute("data-reading-mode", "spacious")
  await expect(root).toHaveAttribute("data-geometry-controls", "left")

  await page.getByRole("button", { name: "Fächerlabor öffnen" }).click()
  await page.getByRole("button", { name: "Mathematik-Konzeptlabor öffnen" }).click()
  const lociCard = page.locator(".concept-library-card").filter({ hasText: "Geometrische Orte" })
  await lociCard.getByRole("button", { name: "Konzept öffnen" }).click()
  await expect(page.locator(".topic-hero")).toContainText("Geometrische Orte")

  const tools = page.locator(".geometry-workspace .geometry-tools")
  const canvas = page.locator(".geometry-workspace .geometry-canvas-wrap")
  await expect(tools).toBeVisible()
  expect(await tools.evaluate((element) => getComputedStyle(element).gridColumnStart)).toBe("1")
  expect(await canvas.evaluate((element) => getComputedStyle(element).gridColumnStart)).toBe("2")
  const [toolsBox, canvasBox] = await Promise.all([tools.boundingBox(), canvas.boundingBox()])
  expect(toolsBox).not.toBeNull()
  expect(canvasBox).not.toBeNull()
  expect(canvasBox!.width).toBeGreaterThan(toolsBox!.width * 1.8)
  await expectNoWcagViolations(page, "spacious reading and left-handed geometry workspace")

  await page.reload()
  await expect(root).toHaveAttribute("data-reading-mode", "spacious")
  await expect(root).toHaveAttribute("data-geometry-controls", "left")
})

test("persists minimal focus while keeping the learning plan, XP, and reviews visible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto("/")
  await page.getByLabel("Dein Spitzname").fill(`A11y-Focus-${test.info().project.name}`)
  await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  const focusButton = page.getByRole("button", { name: /^Fokus/u })
  await focusButton.click()
  await expect(focusButton).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()

  const root = page.locator("html")
  await expect(root).toHaveAttribute("data-visual-mode", "focus")
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
  await expect(page.locator(".home-progress-disclosure > summary")).toContainText("0 XP")
  await expect(page.locator(".home-progress-disclosure > summary")).toContainText("Nächste Standortbestimmung")
  await expect(page.locator(".task-card")).not.toHaveCount(0)
  await expect(page.locator(".primary-plan-step .primary-button")).toBeInViewport()
  await expect(page.getByRole("button", { name: "Fächerlabor öffnen" })).toBeVisible()
  await expect(page.getByText("HEUTIGE QUEST")).toHaveCount(0)
  await expect(page.getByText("MATHE-EXPEDITION")).toHaveCount(0)
  await expect(page.getByText("ABZEICHEN", { exact: true })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /Sammlung öffnen/u })).toHaveCount(0)
  await expectNoHorizontalOverflow(page, "minimal-focus learning plan at 320px")
  await expectNoWcagViolations(page, "minimal-focus learning plan at 320px")

  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()
  await expect(page.getByText("Lernplan, XP und Reviews bleiben; Quests, Abzeichen und Sammlung werden ausgeblendet.")).toBeVisible()
  await expect(page.locator(".achievements-panel")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Expedition öffnen" })).toHaveCount(0)
  await expectNoHorizontalOverflow(page, "minimal-focus progress at 320px")
  await expectNoWcagViolations(page, "minimal-focus progress at 320px")

  await page.reload()
  await expect(root).toHaveAttribute("data-visual-mode", "focus")
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
  await expect(page.getByText("HEUTIGE QUEST")).toHaveCount(0)
  await expect(page.getByText("MATHE-EXPEDITION")).toHaveCount(0)
})

test("supports keyboard activation, reduced motion, high contrast, and 320px reflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto("/")
  await expectNoHorizontalOverflow(page, "profile step 1 at 320px")

  await page.getByLabel("Dein Spitzname").fill(`A11y-Narrow-${test.info().project.name}`)
  await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
  const rhythmButton = page.getByRole("button", { name: "Lernrhythmus wählen" })
  await rhythmButton.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("heading", { name: "Wie soll GymiQuest dich begleiten?" })).toBeVisible()
  await expectNoHorizontalOverflow(page, "profile step 2 at 320px")

  const highContrastButton = page.getByRole("button", { name: /^Hoher Kontrast/u })
  await highContrastButton.focus()
  await page.keyboard.press("Space")
  await expect(highContrastButton).toHaveAttribute("aria-pressed", "true")
  expect(await highContrastButton.evaluate((button) => getComputedStyle(button).outlineWidth)).toBe("3px")

  const saveButton = page.getByRole("button", { name: "Profil speichern und starten" })
  const transitionDurations = await saveButton.evaluate((button) => (
    getComputedStyle(button).transitionDuration.split(",").map((duration) => parseFloat(duration))
  ))
  expect(Math.max(...transitionDurations)).toBeLessThanOrEqual(0.00001)
  await saveButton.focus()
  await page.keyboard.press("Enter")

  const foundationsButton = page.getByRole("button", { name: "Bei den Grundlagen starten" })
  await foundationsButton.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("data-visual-mode", "high-contrast")
  await expectNoHorizontalOverflow(page, "high-contrast learning plan at 320px")
  await expectNoWcagViolations(page, "high-contrast learning plan at 320px")

  await page.locator(".home-progress-disclosure > summary").click()
  await page.getByRole("button", { name: /Sammlung öffnen/u }).click()
  await expect(page.getByRole("heading", { name: "Lernarbeit wird zu einer sichtbaren Reise." })).toBeVisible()
  await expectNoHorizontalOverflow(page, "expedition collection at 320px")
  await expectNoWcagViolations(page, "expedition collection at 320px")
})

test("renders every dynamic topic through the production learner surface without WCAG violations", async ({ page }) => {
  test.setTimeout(120_000)
  await openAuthorValidationLab(page, `A11y-Matrix-${test.info().project.name}`)
  await expectNoHorizontalOverflow(page, "author validation lab")
  await expectNoWcagViolations(page, "author validation lab")
  await page.setViewportSize({ width: 320, height: 900 })
  await expectNoHorizontalOverflow(page, "author validation lab at 320px")

  const topicSelect = page.locator("#author-validation-topic")
  const topicOptions = await topicSelect.locator("option").evaluateAll((options) => options.map((option) => ({
    value: (option as HTMLOptionElement).value,
    shortTitle: (option.textContent ?? "").replace(/^\d+\.\s*/u, ""),
  })))
  const bandLabels = ["Aufbau", "Standard", "Prüfungsnah"] as const

  expect(topicOptions).toHaveLength(23)
  expect(new Set(topicOptions.map(({ value }) => value)).size).toBe(topicOptions.length)

  for (const [index, topic] of topicOptions.entries()) {
    const bandLabel = bandLabels[index % bandLabels.length]!
    const context = `${topic.value} (${bandLabel}) learner surface at 320px`
    await test.step(context, async () => {
      await topicSelect.selectOption(topic.value)
      const bandButton = page.getByRole("button", { name: bandLabel, exact: true })
      await bandButton.click()
      await expect(bandButton).toHaveAttribute("aria-pressed", "true")
      await page.getByRole("button", { name: "Lernansicht prüfen" }).click()

      const questionCard = page.locator(".question-card")
      await expect(questionCard).toBeVisible()
      await expect(questionCard.locator("h1")).not.toHaveText("")
      await expect(questionCard.locator(".question-context")).toContainText(topic.shortTitle)

      const responseControl = questionCard.locator(
        ".answer-form input:not([disabled]), .answer-form button:not([disabled])",
      ).first()
      await expect(responseControl, `${topic.value} has no usable learner response control`).toBeVisible()
      await responseControl.focus()
      await expect(responseControl).toBeFocused()

      await expectNoHorizontalOverflow(page, context)
      await expectNoWcagViolations(page, context)

      await page.getByRole("button", { name: "Prüflabor", exact: true }).click()
      await expect(topicSelect).toHaveValue(topic.value)
    })
  }
})
