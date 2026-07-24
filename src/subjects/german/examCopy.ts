import type { AppLocale } from "../../i18n/localization"

export interface GermanExamUiCopy {
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
  passage: string
  matchingSelect: string
  question: (current: number, total: number) => string
  answered: (answered: number, total: number) => string
  flag: string
  unflag: string
  previous: string
  next: string
  exit: string
  submitOpen: string
  submitTitle: string
  submitBody: (unanswered: number) => string
  submit: string
  timeout: string
  resultEyebrow: string
  resultTitle: string
  resultScore: (correct: number, total: number) => string
  resultBody: string
  noXp: string
  openReview: string
  reviewEyebrow: string
  reviewTitle: string
  reviewBody: string
  reviewMistakes: (count: number) => string
  yourAnswer: string
  correctAnswer: string
  explanation: string
  allCorrect: string
  back: string
}

const de: GermanExamUiCopy = {
  eyebrow: "GENERIERTE 45-MINUTEN-SIMULATION",
  cardTitle: "Deutsch-Sprachprüfung trainieren",
  cardBody: "15 neue objektive Aufgaben aus den wiederkehrenden Mustern der Prüfungen 2015–2026, mit durchgehend verfügbarem Textblatt. Die Inhalte sind neu verfasst.",
  open: "Prüfungsmodus öffnen",
  resume: "Sprachprüfung fortsetzen",
  introTitle: "45 Minuten wie in der Sprachprüfung",
  introBody: "Diese generierte Trainingsprüfung ist keine kopierte offizielle Prüfung. Ihre 20 Trainingspunkte sind nicht mit den wechselnden offiziellen Punktetotalen vergleichbar. Die Uhr läuft nach dem Start auch weiter, wenn du die App verlässt.",
  facts: ["15 automatisch bewertete Aufgaben", "Textblatt immer sichtbar", "freie Reihenfolge und Markierungen", "keine XP und keine offizielle Note"],
  start: "45-Minuten-Simulation starten",
  cancel: "Noch nicht",
  passage: "TEXTBLATT",
  matchingSelect: "Zuordnung wählen",
  question: (current, total) => `Aufgabe ${current} von ${total}`,
  answered: (answered, total) => `${answered}/${total} beantwortet`,
  flag: "Zum Prüfen markieren",
  unflag: "Markierung entfernen",
  previous: "Zurück",
  next: "Weiter",
  exit: "Pausieren und zum Lernplan",
  submitOpen: "Prüfung abgeben",
  submitTitle: "Sprachprüfung jetzt abgeben?",
  submitBody: (unanswered) => unanswered === 0
    ? "Alle Aufgaben sind beantwortet. Nach der Abgabe kannst du nichts mehr ändern."
    : `${unanswered} Aufgaben sind noch unbeantwortet. Nach der Abgabe kannst du nichts mehr ändern.`,
  submit: "Endgültig abgeben",
  timeout: "Die 45 Minuten sind vorbei. Deine gespeicherten Antworten wurden abgegeben.",
  resultEyebrow: "SPRACHPRÜFUNG AUSGEWERTET",
  resultTitle: "Dein objektiver Trainingsstand",
  resultScore: (correct, total) => `${correct} von ${total} Punkten`,
  resultBody: "Unsichere Lernfelder kommen mit neuen Texten und Sätzen als Review zurück.",
  noXp: "Prüfungspunkte sind keine XP und keine offizielle ZAP-Note.",
  openReview: "Fehler ansehen",
  reviewEyebrow: "PRÜFUNGS-RÜCKBLICK",
  reviewTitle: "Deine Fehler mit den richtigen Lösungen",
  reviewBody: "Die Antworten waren während der Prüfung verborgen. Jetzt kannst du jede unsichere Stelle in Ruhe vergleichen.",
  reviewMistakes: (count) => `${count} ${count === 1 ? "Fehler" : "Fehler"}`,
  yourAnswer: "Deine Antwort",
  correctAnswer: "Richtige Antwort",
  explanation: "Warum",
  allCorrect: "Keine Fehler – alle automatisch bewerteten Antworten waren sicher.",
  back: "Zurück zum Deutsch-Lernplan",
}

const en: GermanExamUiCopy = {
  ...de,
  eyebrow: "GENERATED 45-MINUTE SIMULATION",
  cardTitle: "Practise the German language exam",
  cardBody: "15 fresh objective questions based on recurring patterns across the 2015–2026 papers, with the text sheet available throughout. All training content is newly authored.",
  open: "Open exam mode",
  resume: "Continue language exam",
  introTitle: "45 minutes like the language exam",
  introBody: "This generated paper is not a copied official exam. Its 20 training points are not comparable with the changing official totals. Once started, its clock keeps running even if you leave the app.",
  facts: ["15 automatically graded questions", "text sheet always available", "free order and flags", "no XP and no official grade"],
  start: "Start 45-minute simulation",
  cancel: "Not yet",
  passage: "TEXT SHEET",
  matchingSelect: "Choose a match",
  question: (current, total) => `Question ${current} of ${total}`,
  answered: (answered, total) => `${answered}/${total} answered`,
  flag: "Flag for review",
  unflag: "Remove flag",
  previous: "Previous",
  next: "Next",
  exit: "Pause and return to plan",
  submitOpen: "Submit exam",
  submitTitle: "Submit the language exam now?",
  submitBody: (unanswered) => unanswered === 0
    ? "Every question is answered. You cannot make changes after submission."
    : `${unanswered} questions are still unanswered. You cannot make changes after submission.`,
  submit: "Submit permanently",
  timeout: "The 45 minutes are over. Your saved answers were submitted.",
  resultEyebrow: "LANGUAGE EXAM SCORED",
  resultTitle: "Your objective training result",
  resultScore: (correct, total) => `${correct} of ${total} points`,
  resultBody: "Unsecure skills return as reviews with fresh texts and sentences.",
  noXp: "Exam points are not XP and not an official ZAP grade.",
  openReview: "Review mistakes",
  reviewEyebrow: "EXAM REVIEW",
  reviewTitle: "Your mistakes with the correct solutions",
  reviewBody: "Answers stayed hidden during the exam. You can now compare every uncertain point calmly.",
  reviewMistakes: (count) => `${count} ${count === 1 ? "mistake" : "mistakes"}`,
  yourAnswer: "Your answer",
  correctAnswer: "Correct answer",
  explanation: "Why",
  allCorrect: "No mistakes – every automatically graded answer was secure.",
  back: "Back to the German learning plan",
}

const it: GermanExamUiCopy = {
  ...en,
  eyebrow: "SIMULAZIONE GENERATA DI 45 MINUTI",
  cardTitle: "Allenati per la prova di tedesco",
  cardBody: "15 nuove domande oggettive basate sui modelli ricorrenti degli esami 2015–2026, con il foglio di testo sempre disponibile. I contenuti sono originali.",
  open: "Apri modalità esame",
  resume: "Continua prova di lingua",
  introTitle: "45 minuti come nella prova di lingua",
  introBody: "Questa simulazione non copia un esame ufficiale. I suoi 20 punti di allenamento non sono confrontabili con i totali ufficiali variabili. Dopo l'avvio, il tempo continua anche se lasci l'app.",
  facts: ["15 domande valutate automaticamente", "foglio di testo sempre disponibile", "ordine libero e contrassegni", "nessun XP e nessun voto ufficiale"],
  start: "Avvia simulazione di 45 minuti",
  cancel: "Non ancora",
  passage: "FOGLIO DI TESTO",
  matchingSelect: "Scegli un abbinamento",
  question: (current, total) => `Domanda ${current} di ${total}`,
  answered: (answered, total) => `${answered}/${total} risposte`,
  flag: "Contrassegna per il controllo",
  unflag: "Rimuovi contrassegno",
  previous: "Indietro",
  next: "Avanti",
  exit: "Metti in pausa e torna al piano",
  submitOpen: "Consegna prova",
  submitTitle: "Consegnare ora la prova di lingua?",
  submitBody: (unanswered) => unanswered === 0
    ? "Hai risposto a tutte le domande. Dopo la consegna non potrai più modificarle."
    : `${unanswered} domande sono ancora senza risposta. Dopo la consegna non potrai più modificarle.`,
  submit: "Consegna definitivamente",
  timeout: "I 45 minuti sono terminati. Le risposte salvate sono state consegnate.",
  resultEyebrow: "PROVA DI LINGUA VALUTATA",
  resultTitle: "Il tuo risultato oggettivo",
  resultScore: (correct, total) => `${correct} punti su ${total}`,
  resultBody: "Le abilità insicure tornano come ripassi con testi e frasi nuovi.",
  noXp: "I punti della prova non sono XP né un voto ZAP ufficiale.",
  openReview: "Rivedi gli errori",
  reviewEyebrow: "RIEPILOGO DELLA PROVA",
  reviewTitle: "I tuoi errori con le soluzioni corrette",
  reviewBody: "Durante la prova le risposte erano nascoste. Ora puoi confrontare con calma ogni punto incerto.",
  reviewMistakes: (count) => `${count} ${count === 1 ? "errore" : "errori"}`,
  yourAnswer: "La tua risposta",
  correctAnswer: "Risposta corretta",
  explanation: "Perché",
  allCorrect: "Nessun errore: tutte le risposte valutate automaticamente erano sicure.",
  back: "Torna al piano di tedesco",
}

const es: GermanExamUiCopy = {
  ...en,
  eyebrow: "SIMULACIÓN GENERADA DE 45 MINUTOS",
  cardTitle: "Practica el examen de lengua alemana",
  cardBody: "15 preguntas objetivas nuevas basadas en patrones recurrentes de los exámenes de 2015–2026, con la hoja de texto siempre disponible. El contenido es original.",
  open: "Abrir modo examen",
  resume: "Continuar examen de lengua",
  introTitle: "45 minutos como en el examen de lengua",
  introBody: "Esta simulación no copia un examen oficial. Sus 20 puntos de práctica no son comparables con los totales oficiales variables. Tras empezar, el tiempo sigue corriendo aunque salgas de la app.",
  facts: ["15 preguntas corregidas automáticamente", "hoja de texto siempre disponible", "orden libre y marcadores", "sin XP ni nota oficial"],
  start: "Iniciar simulación de 45 minutos",
  cancel: "Ahora no",
  passage: "HOJA DE TEXTO",
  matchingSelect: "Elige una correspondencia",
  question: (current, total) => `Pregunta ${current} de ${total}`,
  answered: (answered, total) => `${answered}/${total} respondidas`,
  flag: "Marcar para revisar",
  unflag: "Quitar marca",
  previous: "Anterior",
  next: "Siguiente",
  exit: "Pausar y volver al plan",
  submitOpen: "Entregar examen",
  submitTitle: "¿Entregar ahora el examen de lengua?",
  submitBody: (unanswered) => unanswered === 0
    ? "Todas las preguntas están respondidas. No podrás cambiarlas tras la entrega."
    : `${unanswered} preguntas siguen sin respuesta. No podrás cambiarlas tras la entrega.`,
  submit: "Entregar definitivamente",
  timeout: "Los 45 minutos han terminado. Se entregaron tus respuestas guardadas.",
  resultEyebrow: "EXAMEN DE LENGUA CORREGIDO",
  resultTitle: "Tu resultado objetivo de práctica",
  resultScore: (correct, total) => `${correct} de ${total} puntos`,
  resultBody: "Las habilidades inseguras vuelven como repasos con textos y frases nuevos.",
  noXp: "Los puntos del examen no son XP ni una nota ZAP oficial.",
  openReview: "Revisar errores",
  reviewEyebrow: "REVISIÓN DEL EXAMEN",
  reviewTitle: "Tus errores con las soluciones correctas",
  reviewBody: "Las respuestas permanecieron ocultas durante el examen. Ahora puedes comparar con calma cada punto inseguro.",
  reviewMistakes: (count) => `${count} ${count === 1 ? "error" : "errores"}`,
  yourAnswer: "Tu respuesta",
  correctAnswer: "Respuesta correcta",
  explanation: "Por qué",
  allCorrect: "No hubo errores: todas las respuestas corregidas automáticamente eran seguras.",
  back: "Volver al plan de alemán",
}

export const germanExamUiCopy: Record<AppLocale, GermanExamUiCopy> = { de, en, it, es }
