import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

test("switches the first-run experience to English and keeps it after reload", async ({ page }) => {
  await page.goto("/")

  const language = page.getByLabel("Sprache")
  await expect(language).toHaveValue("de")
  await language.selectOption("en")

  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(page.getByRole("heading", { name: "Who are we planning for, and until when?" })).toBeVisible()
  await expect(page.getByText("No full name needed.")).toBeVisible()
  await expect(page.getByRole("link", { name: "Open privacy and local-data information" })).toHaveText("Privacy")

  await page.reload()

  await expect(page.getByLabel("Language")).toHaveValue("en")
  await expect(page.getByRole("heading", { name: "Who are we planning for, and until when?" })).toBeVisible()
  expect(await page.locator(".profile-setup-card").evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)

  const audit = await new AxeBuilder({ page })
    .include(".profile-setup-card")
    .withTags(wcagTags)
    .analyze()
  expect(audit.violations, JSON.stringify(audit.violations, null, 2)).toEqual([])

  await page.getByLabel("Your nickname").fill("Mia")
  await expect(page.getByLabel("Entrance-exam date")).toHaveValue("2027-03-08")
  await page.getByRole("button", { name: "Choose learning rhythm" }).click()
  await expect(page.getByRole("heading", { name: "How should GymiQuest support you?" })).toBeVisible()
  await page.getByRole("button", { name: "Save profile and start" }).click()

  await expect(page.getByRole("heading", { name: "Let’s find your best starting point." })).toBeVisible()
  await expect(page.getByText("9 questions · about 5 minutes", { exact: false })).toBeVisible()
  await page.getByRole("button", { name: "Begin start check" }).click()

  await expect(page.getByText("Question 1 of 9")).toBeVisible()
  await expect(page.getByText("Start check: no grade and no intermediate results.", { exact: false })).toBeVisible()
  const moreOptions = page.locator(".question-secondary-actions > summary")
  await expect(moreOptions).toContainText("More options")
  await moreOptions.click()
  await expect(page.getByRole("link", { name: "Report an error in this exercise" })).toBeVisible()
  await expect(page.getByText("Aufgabe 1 von 9")).toHaveCount(0)
})

test("lets an existing learner choose the app language directly in settings", async ({ page }) => {
  await page.goto("/")

  await page.getByLabel("Dein Spitzname").fill("Mia")
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()

  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()

  const language = page.locator("#settings-app-language")
  await expect(language).toHaveValue("de")
  await language.selectOption("it")

  await expect(page.locator("html")).toHaveAttribute("lang", "it")
  await expect(page.getByRole("heading", { name: "Mia, ecco come GymiQuest ti sostiene." })).toBeVisible()
  await expect(page.getByLabel("Lingua")).toHaveValue("it")

  const audit = await new AxeBuilder({ page })
    .include(".study-settings-card")
    .withTags(wcagTags)
    .analyze()
  expect(audit.violations, JSON.stringify(audit.violations, null, 2)).toEqual([])

  await page.setViewportSize({ width: 320, height: 800 })
  expect(await page.locator(".study-settings-card").evaluate((element) => (
    element.scrollWidth - element.clientWidth
  ))).toBeLessThanOrEqual(0)

  await page.reload()

  await expect(page.locator("html")).toHaveAttribute("lang", "it")
  await expect(page.getByRole("heading", { name: "Il tuo piano di studio" })).toBeVisible()

  await page.getByRole("button", { name: "Apri i progressi" }).click()
  await page.locator("#settings-app-language").selectOption("es")
  await expect(page.locator("html")).toHaveAttribute("lang", "es")
  await expect(page.locator("#settings-app-language")).toHaveValue("es")

  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("lang", "es")
  await expect(page.getByRole("heading", { name: "Tu plan de estudio" })).toBeVisible()
})

test("keeps the standalone privacy page in the selected language", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("gymiquest.app-locale.v1", "en")
  })
  await page.goto("/datenschutz.html")

  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(page.getByRole("heading", { name: "Your learning stays on your device." })).toBeVisible()
  await expect(page.getByText("Your learning stays on your device.")).toHaveCount(1)
  await page.getByLabel("Language / Lingua / Idioma / Sprache").selectOption("de")

  await expect(page.locator("html")).toHaveAttribute("lang", "de-CH")
  await expect(page.getByRole("heading", { name: "Dein Lernen bleibt auf deinem Gerät." })).toBeVisible()
})

test("persists Italian through onboarding and into the first generated question", async ({ page }) => {
  await page.goto("/")

  await page.getByLabel("Sprache").selectOption("it")
  await expect(page.locator("html")).toHaveAttribute("lang", "it")
  await expect(page.getByRole("heading", { name: "Per chi e fino a quando pianifichiamo?" })).toBeVisible()
  await expect(page.getByText("Non serve il nome completo.")).toBeVisible()

  await page.reload()
  await expect(page.getByLabel("Lingua")).toHaveValue("it")
  await expect(page.getByRole("heading", { name: "Per chi e fino a quando pianifichiamo?" })).toBeVisible()

  await page.getByLabel("Il tuo soprannome").fill("Mia")
  await expect(page.getByLabel("Data dell'esame d'ammissione")).toHaveValue("2027-03-08")
  await page.getByRole("button", { name: "Scegli il ritmo di studio" }).click()
  await page.getByRole("button", { name: "Salva il profilo e inizia" }).click()

  await expect(page.getByRole("heading", { name: "Troviamo il punto di partenza migliore per te." })).toBeVisible()
  await page.getByRole("button", { name: "Inizia la verifica iniziale" }).click()

  await expect(page.getByText("Domanda 1 di 9")).toBeVisible()
  await expect(page.getByText("Verifica iniziale: nessun voto e nessun risultato intermedio.", { exact: false })).toBeVisible()
  await page.locator(".question-secondary-actions > summary").click()
  await expect(page.getByRole("link", { name: "Segnala un errore in questo esercizio" })).toBeVisible()
  await expect(page.getByText("Aufgabe 1 von 9")).toHaveCount(0)
  await expect(page.getByText("Question 1 of 9")).toHaveCount(0)

  const audit = await new AxeBuilder({ page })
    .include(".question-card")
    .withTags(wcagTags)
    .analyze()
  expect(audit.violations, JSON.stringify(audit.violations, null, 2)).toEqual([])
})

test("renders and persists the Italian standalone privacy page", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("gymiquest.app-locale.v1", "it")
  })
  await page.goto("/datenschutz.html")

  await expect(page.locator("html")).toHaveAttribute("lang", "it")
  await expect(page.getByRole("heading", { name: "Il tuo apprendimento resta sul tuo dispositivo." })).toBeVisible()
  await expect(page.getByText("Il tuo apprendimento resta sul tuo dispositivo.")).toHaveCount(1)
  await expect(page.getByLabel("Language / Lingua / Idioma / Sprache")).toHaveValue("it")
})

test("persists Spanish through onboarding and into the first generated question", async ({ page }) => {
  await page.goto("/")

  await page.getByLabel("Sprache").selectOption("es")
  await expect(page.locator("html")).toHaveAttribute("lang", "es")
  await expect(page.getByRole("heading", { name: "¿Para quién y hasta cuándo hacemos el plan?" })).toBeVisible()
  await expect(page.getByText("No hace falta tu nombre completo.")).toBeVisible()

  await page.reload()
  await expect(page.getByLabel("Idioma")).toHaveValue("es")
  await expect(page.getByRole("heading", { name: "¿Para quién y hasta cuándo hacemos el plan?" })).toBeVisible()

  await page.getByLabel("Tu apodo").fill("Mía")
  await expect(page.getByLabel("Fecha del examen de ingreso")).toHaveValue("2027-03-08")
  await page.getByRole("button", { name: "Elegir ritmo de estudio" }).click()
  await page.getByRole("button", { name: "Guardar perfil y empezar" }).click()

  await expect(page.getByRole("heading", { name: "Encontremos el mejor punto de partida para ti." })).toBeVisible()
  await page.getByRole("button", { name: "Empezar la prueba inicial" }).click()

  await expect(page.getByText("Pregunta 1 de 9")).toBeVisible()
  await expect(page.getByText("Prueba inicial: sin nota ni resultados intermedios.", { exact: false })).toBeVisible()
  await page.locator(".question-secondary-actions > summary").click()
  await expect(page.getByRole("link", { name: "Informar de un error en este ejercicio" })).toBeVisible()
  await expect(page.getByText("Aufgabe 1 von 9")).toHaveCount(0)
  await expect(page.getByText("Question 1 of 9")).toHaveCount(0)
  await expect(page.getByText("Domanda 1 di 9")).toHaveCount(0)

  const audit = await new AxeBuilder({ page })
    .include(".question-card")
    .withTags(wcagTags)
    .analyze()
  expect(audit.violations, JSON.stringify(audit.violations, null, 2)).toEqual([])
})

test("renders and persists the Spanish standalone privacy page", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("gymiquest.app-locale.v1", "es")
  })
  await page.goto("/datenschutz.html")

  await expect(page.locator("html")).toHaveAttribute("lang", "es")
  await expect(page.getByRole("heading", { name: "Tu aprendizaje se queda en tu dispositivo." })).toBeVisible()
  await expect(page.getByText("Tu aprendizaje se queda en tu dispositivo.")).toHaveCount(1)
  await expect(page.getByLabel("Language / Lingua / Idioma / Sprache")).toHaveValue("es")
})
