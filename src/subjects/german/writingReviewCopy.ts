import type { AppLocale } from "../../i18n/localization"

export interface GermanWritingReviewUiCopy {
  eyebrow: string
  title: string
  intro: string
  pending: (count: number) => string
  reviewed: string
  awaiting: string
  submitted: (date: string) => string
  summary: (words: number, checks: number) => string
  open: string
  prompt: string
  draft: string
  strength: string
  strengthHint: string
  strengthPlaceholder: string
  nextStep: string
  nextStepHint: string
  nextStepPlaceholder: string
  save: string
  saved: string
  boundary: string
  learnerEyebrow: string
  learnerTitle: string
  learnerBody: string
  reviewedAt: (date: string) => string
  revisionHistory: string
  revisionHistoryBody: string
  revisionSnapshot: (number: number, date: string) => string
  revisionWordCount: (count: number) => string
  feedbackLocked: string
}

const de: GermanWritingReviewUiCopy = {
  eyebrow: "DEUTSCH · MENSCHLICHE TEXTRÜCKMELDUNG",
  title: "Gemeinsam einen Text weiterbringen",
  intro: "Lies den Text mit der lernenden Person. Halte genau eine konkrete Stärke und einen nächsten Arbeitsschritt fest.",
  pending: (count) => `${count} ${count === 1 ? "Text wartet" : "Texte warten"}`,
  reviewed: "Rückmeldung gespeichert",
  awaiting: "Wartet auf Rückmeldung",
  submitted: (date) => `Abgeschlossen am ${date}`,
  summary: (words, checks) => `${words} Wörter · ${checks}/6 Prüfschritte`,
  open: "Text und Auftrag öffnen",
  prompt: "Schreibauftrag",
  draft: "Text der lernenden Person",
  strength: "Das gelingt bereits",
  strengthHint: "Nenne eine beobachtbare Stelle oder Wirkung, nicht nur «gut». Keine Note.",
  strengthPlaceholder: "Zum Beispiel: Der Einstieg macht Ort und Konflikt sofort verständlich.",
  nextStep: "Ein nächster Arbeitsschritt",
  nextStepHint: "Wähle genau einen erreichbaren Schwerpunkt für den nächsten Text.",
  nextStepPlaceholder: "Zum Beispiel: Im Hauptteil die Zeitform Satz für Satz prüfen.",
  save: "Menschliche Rückmeldung speichern",
  saved: "Rückmeldung lokal gespeichert",
  boundary: "Diese Rückmeldung vergibt keine Punkte, XP oder ZAP-Note und verändert keine Lernstufe. Sie wird nur lokal und in verschlüsselten Backups gespeichert.",
  learnerEyebrow: "MENSCHLICHE RÜCKMELDUNG",
  learnerTitle: "Dein konkreter nächster Schritt",
  learnerBody: "Diese Hinweise stammen von deiner Begleitperson, nicht von einer automatischen Bewertung.",
  reviewedAt: (date) => `Besprochen am ${date}`,
  revisionHistory: "Gespeicherte Überarbeitungen",
  revisionHistoryBody: "Diese Fassungen sind unveränderliche Vergleichspunkte. Die Begleitperson kann sie lesen, aber nicht bearbeiten.",
  revisionSnapshot: (number, date) => `Fassung ${number} · ${date}`,
  revisionWordCount: (count) => `${count} Wörter`,
  feedbackLocked: "Die ursprüngliche Rückmeldung ist seit Beginn der Überarbeitung unveränderlich.",
}

const en: GermanWritingReviewUiCopy = {
  ...de,
  eyebrow: "GERMAN · HUMAN WRITING FEEDBACK",
  title: "Move one text forward together",
  intro: "Read the text with the learner. Record exactly one concrete strength and one next step.",
  pending: (count) => `${count} ${count === 1 ? "text is" : "texts are"} waiting`,
  reviewed: "Feedback saved",
  awaiting: "Awaiting feedback",
  submitted: (date) => `Completed on ${date}`,
  summary: (words, checks) => `${words} words · ${checks}/6 review checks`,
  open: "Open text and prompt",
  prompt: "Writing prompt",
  draft: "Learner's text",
  strength: "What already works",
  strengthHint: "Name an observable passage or effect, not just ‘good’. Do not assign a grade.",
  strengthPlaceholder: "For example: The opening makes the place and conflict immediately clear.",
  nextStep: "One next step",
  nextStepHint: "Choose exactly one achievable focus for the next text.",
  nextStepPlaceholder: "For example: Check the tense sentence by sentence in the main section.",
  save: "Save human feedback",
  saved: "Feedback saved locally",
  boundary: "This feedback awards no points, XP, or ZAP grade and changes no mastery level. It is stored only locally and in encrypted backups.",
  learnerEyebrow: "HUMAN FEEDBACK",
  learnerTitle: "Your concrete next step",
  learnerBody: "These notes come from your companion, not from automatic grading.",
  reviewedAt: (date) => `Discussed on ${date}`,
  revisionHistory: "Saved revisions",
  revisionHistoryBody: "These versions are immutable comparison points. The companion can read but not edit them.",
  revisionSnapshot: (number, date) => `Version ${number} · ${date}`,
  revisionWordCount: (count) => `${count} words`,
  feedbackLocked: "The original feedback is immutable because revision work has begun.",
}

const it: GermanWritingReviewUiCopy = {
  ...en,
  eyebrow: "TEDESCO · RISCONTRO UMANO SUL TESTO",
  title: "Migliorare insieme un testo",
  intro: "Leggete il testo insieme. Annotate esattamente un punto di forza concreto e un passo successivo.",
  pending: (count) => `${count} ${count === 1 ? "testo in attesa" : "testi in attesa"}`,
  reviewed: "Riscontro salvato",
  awaiting: "In attesa di riscontro",
  submitted: (date) => `Concluso il ${date}`,
  summary: (words, checks) => `${words} parole · ${checks}/6 controlli`,
  open: "Apri testo e traccia",
  prompt: "Traccia",
  draft: "Testo dello studente",
  strength: "Che cosa funziona già",
  strengthHint: "Indica un passaggio o un effetto osservabile, non soltanto «bene». Nessun voto.",
  strengthPlaceholder: "Per esempio: L'inizio chiarisce subito luogo e conflitto.",
  nextStep: "Un prossimo passo",
  nextStepHint: "Scegli un solo obiettivo raggiungibile per il prossimo testo.",
  nextStepPlaceholder: "Per esempio: Controllare il tempo verbale frase per frase nella parte centrale.",
  save: "Salva il riscontro umano",
  saved: "Riscontro salvato in locale",
  boundary: "Questo riscontro non assegna punti, XP o voto ZAP e non modifica il livello. Viene salvato solo in locale e nei backup cifrati.",
  learnerEyebrow: "RISCONTRO UMANO",
  learnerTitle: "Il tuo prossimo passo concreto",
  learnerBody: "Queste indicazioni vengono dalla persona che ti accompagna, non da una valutazione automatica.",
  reviewedAt: (date) => `Discusso il ${date}`,
  revisionHistory: "Revisioni salvate",
  revisionHistoryBody: "Queste versioni sono punti di confronto immutabili. L'accompagnatore può leggerle, ma non modificarle.",
  revisionSnapshot: (number, date) => `Versione ${number} · ${date}`,
  revisionWordCount: (count) => `${count} parole`,
  feedbackLocked: "Il riscontro originale è immutabile perché la revisione è iniziata.",
}

const es: GermanWritingReviewUiCopy = {
  ...en,
  eyebrow: "ALEMÁN · COMENTARIOS HUMANOS SOBRE EL TEXTO",
  title: "Mejorar juntos un texto",
  intro: "Leed el texto juntos. Anotad exactamente un punto fuerte concreto y un próximo paso.",
  pending: (count) => `${count} ${count === 1 ? "texto pendiente" : "textos pendientes"}`,
  reviewed: "Comentarios guardados",
  awaiting: "Pendiente de comentarios",
  submitted: (date) => `Finalizado el ${date}`,
  summary: (words, checks) => `${words} palabras · ${checks}/6 controles`,
  open: "Abrir texto y tema",
  prompt: "Tema de redacción",
  draft: "Texto del estudiante",
  strength: "Lo que ya funciona",
  strengthHint: "Señala un pasaje o efecto observable, no solo «bien». Sin nota.",
  strengthPlaceholder: "Por ejemplo: El inicio deja claros de inmediato el lugar y el conflicto.",
  nextStep: "Un próximo paso",
  nextStepHint: "Elige un único objetivo alcanzable para el próximo texto.",
  nextStepPlaceholder: "Por ejemplo: Revisar el tiempo verbal frase por frase en el desarrollo.",
  save: "Guardar comentarios humanos",
  saved: "Comentarios guardados en local",
  boundary: "Estos comentarios no conceden puntos, XP ni nota ZAP y no modifican el nivel. Solo se guardan en local y en copias cifradas.",
  learnerEyebrow: "COMENTARIOS HUMANOS",
  learnerTitle: "Tu próximo paso concreto",
  learnerBody: "Estas indicaciones proceden de tu acompañante, no de una evaluación automática.",
  reviewedAt: (date) => `Comentado el ${date}`,
  revisionHistory: "Revisiones guardadas",
  revisionHistoryBody: "Estas versiones son puntos de comparación inmutables. El acompañante puede leerlas, pero no editarlas.",
  revisionSnapshot: (number, date) => `Versión ${number} · ${date}`,
  revisionWordCount: (count) => `${count} palabras`,
  feedbackLocked: "Los comentarios originales son inmutables porque la revisión ya ha comenzado.",
}

export const germanWritingReviewUiCopy: Record<AppLocale, GermanWritingReviewUiCopy> = {
  de,
  en,
  it,
  es,
}
