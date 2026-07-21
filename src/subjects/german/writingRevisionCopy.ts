import type { AppLocale } from "../../i18n/localization"

export interface GermanWritingRevisionUiCopy {
  eyebrow: (number: number, maximum: number) => string
  title: string
  body: string
  back: string
  noScore: string
  feedback: string
  strength: string
  nextStep: string
  prompt: string
  requirements: string
  previousVersion: string
  originalVersion: string
  titleLabel: string
  titlePlaceholder: string
  draftLabel: string
  draftPlaceholder: string
  wordCount: (count: number) => string
  autosave: string
  save: string
  saveHint: string
  start: string
  resume: string
  historyTitle: string
  historyBody: string
  snapshot: (number: number, date: string) => string
  limitReached: string
}

const de: GermanWritingRevisionUiCopy = {
  eyebrow: (number, maximum) => `ÜBERARBEITUNG ${number} VON ${maximum}`,
  title: "Setze den besprochenen nächsten Schritt um",
  body: "Die ursprüngliche Abgabe bleibt unverändert. Bearbeite eine neue Fassung und speichere sie erst, wenn du den Unterschied gemeinsam anschauen möchtest.",
  back: "Zum Deutsch-Lernplan · Entwurf bleibt gespeichert",
  noScore: "Überarbeitungen erhalten keine Punkte, Note, XP oder automatische Lernwirkung.",
  feedback: "Menschliche Rückmeldung",
  strength: "Das trägt bereits",
  nextStep: "Darauf konzentrierst du dich jetzt",
  prompt: "Schreibauftrag",
  requirements: "Verbindliche Vorgaben",
  previousVersion: "Vorherige Fassung zum Vergleichen",
  originalVersion: "Ursprüngliche Abgabe zum Vergleichen",
  titleLabel: "Überarbeiteter Titel",
  titlePlaceholder: "Titel",
  draftLabel: "Überarbeitete Fassung",
  draftPlaceholder: "Überarbeite den Text hier …",
  wordCount: (count) => `${count} Wörter`,
  autosave: "Dieser Entwurf wird automatisch lokal gespeichert.",
  save: "Diese Fassung unveränderlich speichern",
  saveHint: "Danach bleibt diese Fassung als Vergleich erhalten. Bis zu fünf Überarbeitungen sind möglich.",
  start: "Text gezielt überarbeiten",
  resume: "Überarbeitung fortsetzen",
  historyTitle: "Gespeicherte Überarbeitungen",
  historyBody: "Jede Fassung bleibt unverändert erhalten, damit ihr den Lernweg vergleichen könnt.",
  snapshot: (number, date) => `Fassung ${number} · ${date}`,
  limitReached: "Fünf Überarbeitungen sind gespeichert. Die ursprüngliche Abgabe und alle Fassungen bleiben erhalten.",
}

const en: GermanWritingRevisionUiCopy = {
  ...de,
  eyebrow: (number, maximum) => `REVISION ${number} OF ${maximum}`,
  title: "Apply the next step you discussed",
  body: "The original submission remains unchanged. Edit a new version and save it only when you want to compare the difference together.",
  back: "Back to German plan · draft stays saved",
  noScore: "Revisions receive no points, grade, XP, or automatic learning effect.",
  feedback: "Human feedback",
  strength: "What already works",
  nextStep: "Your focus now",
  prompt: "Writing prompt",
  requirements: "Required elements",
  previousVersion: "Previous version for comparison",
  originalVersion: "Original submission for comparison",
  titleLabel: "Revised title",
  titlePlaceholder: "Title",
  draftLabel: "Revised version",
  draftPlaceholder: "Revise the text here …",
  wordCount: (count) => `${count} words`,
  autosave: "This draft is saved locally automatically.",
  save: "Save this version as immutable",
  saveHint: "This version then remains available for comparison. Up to five revisions are possible.",
  start: "Revise this text",
  resume: "Continue revision",
  historyTitle: "Saved revisions",
  historyBody: "Every version stays unchanged so you can compare the learning path together.",
  snapshot: (number, date) => `Version ${number} · ${date}`,
  limitReached: "Five revisions are saved. The original submission and every version remain available.",
}

const it: GermanWritingRevisionUiCopy = {
  ...en,
  eyebrow: (number, maximum) => `REVISIONE ${number} DI ${maximum}`,
  title: "Applica il prossimo passo concordato",
  body: "La consegna originale resta invariata. Modifica una nuova versione e salvala quando volete confrontare insieme la differenza.",
  back: "Torna al piano di tedesco · la bozza resta salvata",
  noScore: "Le revisioni non ricevono punti, voto, XP o effetti automatici.",
  feedback: "Riscontro umano",
  strength: "Ciò che funziona già",
  nextStep: "Il tuo obiettivo ora",
  prompt: "Traccia",
  requirements: "Vincoli obbligatori",
  previousVersion: "Versione precedente da confrontare",
  originalVersion: "Consegna originale da confrontare",
  titleLabel: "Titolo revisionato",
  titlePlaceholder: "Titolo",
  draftLabel: "Versione revisionata",
  draftPlaceholder: "Rivedi qui il testo …",
  wordCount: (count) => `${count} parole`,
  autosave: "Questa bozza viene salvata automaticamente in locale.",
  save: "Salva questa versione come immutabile",
  saveHint: "La versione resterà disponibile per il confronto. Sono possibili fino a cinque revisioni.",
  start: "Rivedi questo testo",
  resume: "Continua la revisione",
  historyTitle: "Revisioni salvate",
  historyBody: "Ogni versione resta invariata per confrontare insieme il percorso.",
  snapshot: (number, date) => `Versione ${number} · ${date}`,
  limitReached: "Sono salvate cinque revisioni. La consegna originale e tutte le versioni restano disponibili.",
}

const es: GermanWritingRevisionUiCopy = {
  ...en,
  eyebrow: (number, maximum) => `REVISIÓN ${number} DE ${maximum}`,
  title: "Aplica el siguiente paso acordado",
  body: "La entrega original permanece intacta. Edita una versión nueva y guárdala cuando queráis comparar juntos la diferencia.",
  back: "Volver al plan de alemán · el borrador queda guardado",
  noScore: "Las revisiones no reciben puntos, nota, XP ni efecto automático.",
  feedback: "Comentarios humanos",
  strength: "Lo que ya funciona",
  nextStep: "Tu objetivo ahora",
  prompt: "Tema de redacción",
  requirements: "Requisitos obligatorios",
  previousVersion: "Versión anterior para comparar",
  originalVersion: "Entrega original para comparar",
  titleLabel: "Título revisado",
  titlePlaceholder: "Título",
  draftLabel: "Versión revisada",
  draftPlaceholder: "Revisa aquí el texto …",
  wordCount: (count) => `${count} palabras`,
  autosave: "Este borrador se guarda automáticamente en local.",
  save: "Guardar esta versión como inmutable",
  saveHint: "La versión quedará disponible para comparar. Se permiten hasta cinco revisiones.",
  start: "Revisar este texto",
  resume: "Continuar la revisión",
  historyTitle: "Revisiones guardadas",
  historyBody: "Cada versión permanece intacta para comparar juntos el proceso.",
  snapshot: (number, date) => `Versión ${number} · ${date}`,
  limitReached: "Hay cinco revisiones guardadas. La entrega original y todas las versiones siguen disponibles.",
}

export const germanWritingRevisionUiCopy: Record<AppLocale, GermanWritingRevisionUiCopy> = {
  de,
  en,
  it,
  es,
}
