import type { AppLocale } from "../../i18n/localization"
import type { GermanWritingReviewCheckId, GermanWritingStage } from "./writing"

export interface GermanWritingUiCopy {
  eyebrow: string
  cardTitle: string
  cardBody: string
  open: string
  resume: string
  introTitle: string
  introBody: string
  facts: readonly string[]
  start: string
  cancel: string
  exit: string
  timerLabel: string
  stages: Record<GermanWritingStage, string>
  chooseTitle: string
  chooseBody: string
  theme: (index: number) => string
  requirements: string
  choose: string
  planTitle: string
  planBody: string
  opening: string
  openingPlaceholder: string
  development: string
  developmentPlaceholder: string
  ending: string
  endingPlaceholder: string
  draftTitle: string
  draftBody: string
  titleLabel: string
  titlePlaceholder: string
  textLabel: string
  textPlaceholder: string
  wordCount: (count: number) => string
  autosave: string
  reviewTitle: string
  reviewBody: string
  checks: Record<GermanWritingReviewCheckId, string>
  noGrade: string
  previous: string
  next: string
  submitOpen: string
  submitTitle: string
  submitBody: string
  submit: string
  timeout: string
  resultEyebrow: string
  resultTitle: string
  resultBody: string
  resultSummary: (words: number, checks: number) => string
  openLast: string
  backHome: string
  plan: string
  draft: string
  empty: string
  available: string
}

const de: GermanWritingUiCopy = {
  eyebrow: "GENERIERTE 60-MINUTEN-SCHREIBWERKSTATT",
  cardTitle: "Text verfassen trainieren",
  cardBody: "Wähle eines von drei neuen Themen, plane deinen Text, schreibe unter Zeitdruck und prüfe ihn mit einer klaren Checkliste.",
  open: "Schreibwerkstatt öffnen",
  resume: "Text fortsetzen",
  introTitle: "60 Minuten für deinen eigenen Text",
  introBody: "Die Themen sind neu verfasst und an wiederkehrenden Aufgabenformen von 2024 und 2025 ausgerichtet. Dein Text wird gespeichert, aber nicht automatisch benotet.",
  facts: ["drei dynamische Themen", "Planung und Entwurf", "60 Minuten ab dem Start", "keine XP und keine automatische Note"],
  start: "60-Minuten-Schreibzeit starten",
  cancel: "Noch nicht",
  exit: "Zum Lernplan · Zeit läuft weiter",
  timerLabel: "Verbleibende Schreibzeit",
  stages: { choose: "Thema", plan: "Plan", draft: "Text", review: "Prüfen" },
  chooseTitle: "Wähle eines der drei Themen",
  chooseBody: "Lies Auftrag und Vorgaben genau. Die Uhr läuft bereits wie in der Prüfung.",
  theme: (index) => `Thema ${index}`,
  requirements: "Verbindliche Vorgaben",
  choose: "Dieses Thema wählen",
  planTitle: "Baue zuerst den roten Faden",
  planBody: "Kurze Stichwörter reichen. Sie sollen dir helfen, beim Schreiben nicht den Auftrag oder das Ende aus den Augen zu verlieren.",
  opening: "Ausgangslage und Einstieg",
  openingPlaceholder: "Wer? Wo? Wann? Welche Situation ist am Anfang klar?",
  development: "Entwicklung, Konflikt oder wichtigste Berichtspunkte",
  developmentPlaceholder: "Welche zwei bis drei Schritte führen durch den Hauptteil?",
  ending: "Ende, Folge oder Schlussaussage",
  endingPlaceholder: "Worauf läuft der Text hinaus?",
  draftTitle: "Schreibe deinen Text",
  draftBody: "Halte Auftrag, Perspektive und Zeitform im Blick. Dein Entwurf wird auf diesem Gerät automatisch gespeichert.",
  titleLabel: "Titel",
  titlePlaceholder: "Passender Titel",
  textLabel: "Dein Text",
  textPlaceholder: "Beginne hier mit deinem Text …",
  wordCount: (count) => `${count} Wörter`,
  autosave: "Automatisch lokal gespeichert",
  reviewTitle: "Lies den ganzen Text noch einmal",
  reviewBody: "Die Checkliste ist eine Selbstkontrolle, keine Note. Markiere nur, was du wirklich geprüft hast.",
  checks: {
    "task-fulfilled": "Alle Teile des Auftrags und die verbindlichen Vorgaben sind erfüllt.",
    "clear-structure": "Einstieg, Hauptteil und Ende sind klar verbunden.",
    "perspective-and-tense": "Erzählperspektive und Zeitform bleiben konsequent.",
    "precise-language": "Verben und Nomen sind treffend; unnötige Wiederholungen sind verbessert.",
    "sentence-variety": "Kurze und längere Sätze wechseln sinnvoll ab.",
    "spelling-and-punctuation": "Grossschreibung, Kommas und Satzzeichen sind geprüft.",
  },
  noGrade: "Offene Texte brauchen menschliche Rückmeldung. GymiQuest vergibt hier weder Punkte noch XP noch eine ZAP-Note.",
  previous: "Zurück",
  next: "Weiter",
  submitOpen: "Text abgeben",
  submitTitle: "Text jetzt abschliessen?",
  submitBody: "Danach bleibt der Text zum gemeinsamen Lesen gespeichert, kann in dieser Runde aber nicht mehr geändert werden.",
  submit: "Text endgültig abgeben",
  timeout: "Die 60 Minuten sind vorbei. Der zuletzt gespeicherte Stand wurde abgeschlossen.",
  resultEyebrow: "TEXT GESPEICHERT",
  resultTitle: "Bereit für menschliche Rückmeldung",
  resultBody: "Der Text wurde nicht automatisch bewertet. Lies ihn gemeinsam mit einer Lehr- oder Begleitperson und besprecht einen konkreten nächsten Schritt.",
  resultSummary: (words, checks) => `${words} Wörter · ${checks}/6 Prüfschritte erledigt`,
  openLast: "Letzten Text ansehen",
  backHome: "Zum Deutsch-Lernplan",
  plan: "Planung",
  draft: "Gespeicherter Text",
  empty: "Noch kein Text gespeichert.",
  available: "Schreibwerkstatt",
}

const en: GermanWritingUiCopy = {
  ...de,
  eyebrow: "GENERATED 60-MINUTE WRITING STUDIO",
  cardTitle: "Practise writing a text",
  cardBody: "Choose one of three fresh prompts, plan, write under time pressure, and review your work with a clear checklist.",
  open: "Open writing studio",
  resume: "Continue text",
  introTitle: "60 minutes for your own text",
  introBody: "The prompts are newly authored and calibrated to recurring 2024 and 2025 task formats. Your text is saved but never automatically graded.",
  facts: ["three dynamic prompts", "planning and draft", "60 minutes from start", "no XP and no automatic grade"],
  start: "Start 60-minute writing time",
  cancel: "Not yet",
  exit: "Return to plan · timer continues",
  timerLabel: "Writing time remaining",
  stages: { choose: "Prompt", plan: "Plan", draft: "Text", review: "Review" },
  chooseTitle: "Choose one of the three prompts",
  chooseBody: "Read the task and requirements carefully. The clock is already running as it does in the exam.",
  theme: (index) => `Prompt ${index}`,
  requirements: "Required elements",
  choose: "Choose this prompt",
  planTitle: "Build the thread first",
  planBody: "Short notes are enough. They should keep the task and ending in view while you write.",
  opening: "Situation and opening",
  openingPlaceholder: "Who? Where? When? What is clear at the start?",
  development: "Development, conflict, or main report points",
  developmentPlaceholder: "Which two or three steps shape the main section?",
  ending: "Ending, consequence, or final message",
  endingPlaceholder: "Where does the text lead?",
  draftTitle: "Write your text",
  draftBody: "Keep the task, perspective, and tense in view. Your draft is saved automatically on this device.",
  titleLabel: "Title",
  titlePlaceholder: "Suitable title",
  textLabel: "Your text",
  textPlaceholder: "Start writing here …",
  wordCount: (count) => `${count} words`,
  autosave: "Saved locally automatically",
  reviewTitle: "Read the whole text once more",
  reviewBody: "This checklist is self-review, not a grade. Mark only what you actually checked.",
  checks: {
    "task-fulfilled": "Every part of the task and each required element is present.",
    "clear-structure": "Opening, main section, and ending connect clearly.",
    "perspective-and-tense": "Perspective and tense stay consistent.",
    "precise-language": "Verbs and nouns are precise; unnecessary repetition is improved.",
    "sentence-variety": "Shorter and longer sentences vary purposefully.",
    "spelling-and-punctuation": "Capitalisation, commas, and punctuation have been checked.",
  },
  noGrade: "Open writing needs human feedback. GymiQuest awards no points, XP, or ZAP grade here.",
  previous: "Previous",
  next: "Next",
  submitOpen: "Submit text",
  submitTitle: "Finish this text now?",
  submitBody: "The text remains saved for shared reading, but can no longer be changed in this round.",
  submit: "Submit permanently",
  timeout: "The 60 minutes are over. The last saved version was completed.",
  resultEyebrow: "TEXT SAVED",
  resultTitle: "Ready for human feedback",
  resultBody: "The text was not automatically graded. Read it with a teacher or companion and agree on one concrete next step.",
  resultSummary: (words, checks) => `${words} words · ${checks}/6 review checks completed`,
  openLast: "View latest text",
  backHome: "Back to German plan",
  plan: "Plan",
  draft: "Saved text",
  empty: "No text saved yet.",
  available: "Writing studio",
}

const it: GermanWritingUiCopy = {
  ...en,
  eyebrow: "LABORATORIO DI SCRITTURA · 60 MINUTI",
  cardTitle: "Allenati a scrivere un testo",
  cardBody: "Scegli una delle tre tracce nuove, pianifica, scrivi con il tempo e controlla il testo con una lista chiara.",
  open: "Apri laboratorio di scrittura",
  resume: "Continua il testo",
  introTitle: "60 minuti per il tuo testo",
  introBody: "Le tracce sono nuove e calibrate sui formati ricorrenti del 2024 e 2025. Il testo viene salvato ma non valutato automaticamente.",
  facts: ["tre tracce dinamiche", "piano e bozza", "60 minuti dall'inizio", "nessun XP e nessun voto automatico"],
  start: "Avvia i 60 minuti",
  cancel: "Non ancora",
  exit: "Torna al piano · il tempo continua",
  timerLabel: "Tempo di scrittura rimanente",
  stages: { choose: "Traccia", plan: "Piano", draft: "Testo", review: "Controllo" },
  chooseTitle: "Scegli una delle tre tracce",
  chooseBody: "Leggi con attenzione consegna e vincoli. Il tempo scorre già come all'esame.",
  theme: (index) => `Traccia ${index}`,
  requirements: "Vincoli obbligatori",
  choose: "Scegli questa traccia",
  planTitle: "Costruisci prima il filo conduttore",
  planBody: "Bastano appunti brevi per non perdere consegna e finale durante la scrittura.",
  opening: "Situazione iniziale",
  openingPlaceholder: "Chi? Dove? Quando? Qual è la situazione iniziale?",
  development: "Sviluppo, conflitto o punti principali",
  developmentPlaceholder: "Quali due o tre passaggi formano la parte centrale?",
  ending: "Finale, conseguenza o messaggio",
  endingPlaceholder: "Verso quale conclusione porta il testo?",
  draftTitle: "Scrivi il tuo testo",
  draftBody: "Tieni presenti consegna, prospettiva e tempo verbale. La bozza viene salvata automaticamente su questo dispositivo.",
  titleLabel: "Titolo",
  titlePlaceholder: "Titolo adatto",
  textLabel: "Il tuo testo",
  textPlaceholder: "Inizia a scrivere qui …",
  wordCount: (count) => `${count} parole`,
  autosave: "Salvato automaticamente in locale",
  reviewTitle: "Rileggi tutto il testo",
  reviewBody: "La lista è un'autoverifica, non un voto. Segna solo ciò che hai davvero controllato.",
  checks: {
    "task-fulfilled": "Sono presenti tutte le parti della consegna e tutti i vincoli obbligatori.",
    "clear-structure": "Introduzione, parte centrale e finale sono collegati con chiarezza.",
    "perspective-and-tense": "Prospettiva e tempo verbale restano coerenti.",
    "precise-language": "Verbi e sostantivi sono precisi; le ripetizioni inutili sono state migliorate.",
    "sentence-variety": "Frasi brevi e lunghe si alternano in modo efficace.",
    "spelling-and-punctuation": "Maiuscole, virgole e punteggiatura sono state controllate.",
  },
  noGrade: "Un testo aperto richiede un riscontro umano. Qui GymiQuest non assegna punti, XP o voto ZAP.",
  previous: "Indietro",
  next: "Avanti",
  submitOpen: "Consegna testo",
  submitTitle: "Concludere ora il testo?",
  submitBody: "Il testo resta salvato per la lettura condivisa, ma non sarà più modificabile in questa sessione.",
  submit: "Consegna definitivamente",
  timeout: "I 60 minuti sono terminati. È stata conclusa l'ultima versione salvata.",
  resultEyebrow: "TESTO SALVATO",
  resultTitle: "Pronto per un riscontro umano",
  resultBody: "Il testo non è stato valutato automaticamente. Leggilo con un insegnante o accompagnatore e concordate un passo successivo concreto.",
  resultSummary: (words, checks) => `${words} parole · ${checks}/6 controlli effettuati`,
  openLast: "Vedi ultimo testo",
  backHome: "Torna al piano di tedesco",
  plan: "Piano",
  draft: "Testo salvato",
  empty: "Nessun testo salvato.",
  available: "Laboratorio di scrittura",
}

const es: GermanWritingUiCopy = {
  ...en,
  eyebrow: "TALLER DE ESCRITURA · 60 MINUTOS",
  cardTitle: "Practica la redacción",
  cardBody: "Elige uno de tres temas nuevos, planifica, escribe con tiempo y revisa el texto con una lista clara.",
  open: "Abrir taller de escritura",
  resume: "Continuar texto",
  introTitle: "60 minutos para tu propio texto",
  introBody: "Los temas son nuevos y están calibrados con formatos recurrentes de 2024 y 2025. El texto se guarda, pero no se califica automáticamente.",
  facts: ["tres temas dinámicos", "plan y borrador", "60 minutos desde el inicio", "sin XP ni nota automática"],
  start: "Iniciar los 60 minutos",
  cancel: "Ahora no",
  exit: "Volver al plan · el tiempo sigue",
  timerLabel: "Tiempo de escritura restante",
  stages: { choose: "Tema", plan: "Plan", draft: "Texto", review: "Revisión" },
  chooseTitle: "Elige uno de los tres temas",
  chooseBody: "Lee con atención la tarea y los requisitos. El reloj ya corre como en el examen.",
  theme: (index) => `Tema ${index}`,
  requirements: "Requisitos obligatorios",
  choose: "Elegir este tema",
  planTitle: "Construye primero el hilo conductor",
  planBody: "Bastan notas breves para mantener a la vista la tarea y el final mientras escribes.",
  opening: "Situación inicial",
  openingPlaceholder: "¿Quién? ¿Dónde? ¿Cuándo? ¿Qué está claro al principio?",
  development: "Desarrollo, conflicto o puntos principales",
  developmentPlaceholder: "¿Qué dos o tres pasos forman la parte central?",
  ending: "Final, consecuencia o mensaje",
  endingPlaceholder: "¿Hacia qué conclusión conduce el texto?",
  draftTitle: "Escribe tu texto",
  draftBody: "Ten presentes la tarea, la perspectiva y el tiempo verbal. El borrador se guarda automáticamente en este dispositivo.",
  titleLabel: "Título",
  titlePlaceholder: "Título adecuado",
  textLabel: "Tu texto",
  textPlaceholder: "Empieza a escribir aquí …",
  wordCount: (count) => `${count} palabras`,
  autosave: "Guardado automáticamente en local",
  reviewTitle: "Lee todo el texto una vez más",
  reviewBody: "La lista es una autoevaluación, no una nota. Marca solo lo que hayas revisado de verdad.",
  checks: {
    "task-fulfilled": "Están presentes todas las partes de la tarea y todos los requisitos obligatorios.",
    "clear-structure": "La introducción, el desarrollo y el final están conectados con claridad.",
    "perspective-and-tense": "La perspectiva y el tiempo verbal se mantienen coherentes.",
    "precise-language": "Los verbos y sustantivos son precisos; se han mejorado las repeticiones innecesarias.",
    "sentence-variety": "Las frases cortas y largas se alternan de forma eficaz.",
    "spelling-and-punctuation": "Se han revisado las mayúsculas, las comas y la puntuación.",
  },
  noGrade: "Un texto abierto necesita comentarios humanos. GymiQuest no concede aquí puntos, XP ni nota ZAP.",
  previous: "Anterior",
  next: "Siguiente",
  submitOpen: "Entregar texto",
  submitTitle: "¿Finalizar el texto ahora?",
  submitBody: "El texto seguirá guardado para leerlo juntos, pero ya no podrá cambiarse en esta sesión.",
  submit: "Entregar definitivamente",
  timeout: "Los 60 minutos han terminado. Se cerró la última versión guardada.",
  resultEyebrow: "TEXTO GUARDADO",
  resultTitle: "Listo para comentarios humanos",
  resultBody: "El texto no se ha calificado automáticamente. Léelo con un docente o acompañante y acordad un próximo paso concreto.",
  resultSummary: (words, checks) => `${words} palabras · ${checks}/6 controles realizados`,
  openLast: "Ver último texto",
  backHome: "Volver al plan de alemán",
  plan: "Plan",
  draft: "Texto guardado",
  empty: "Todavía no hay texto guardado.",
  available: "Taller de escritura",
}

export const germanWritingUiCopy: Record<AppLocale, GermanWritingUiCopy> = { de, en, it, es }
