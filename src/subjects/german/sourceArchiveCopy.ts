import type { AppLocale } from "../../i18n/localization"
import type { GermanSourceArchiveDocumentKind } from "./sourceArchiveCatalog"

export interface GermanSourceArchiveUiCopy {
  eyebrow: string
  title: string
  body: string
  privacy: string
  readyCount: (count: number) => string
  choose: string
  checking: string
  importAria: string
  imported: (count: number) => string
  rejected: (count: number) => string
  failure: string
  yearsAria: string
  localCount: (count: number) => string
  facts: string
  sourceOnly: string
  missing: (label: string) => string
  openDocument: (label: string, year: number) => string
  readerEyebrow: string
  readerBody: string
  close: string
  chooseDocumentAria: string
  pageNavigationAria: string
  previousPage: string
  nextPage: string
  pageOf: (page: number, total: number) => string
  checksum: string
  documentLabels: Record<GermanSourceArchiveDocumentKind, string>
}

const de: GermanSourceArchiveUiCopy = {
  eyebrow: "PRIVATE DEUTSCH-QUELLEN · NUR AUF DIESEM GERÄT",
  title: "Originalunterlagen 2024 und 2025",
  body: "Importiere Sprachprüfung, Lösungen, Textblatt und Aufsatzthemen gemeinsam. GymiQuest erkennt die Dateien am Inhalt, auch wenn sie umbenannt wurden.",
  privacy: "Die PDFs bleiben in diesem Browser, gelangen weder in ein Backup noch in den öffentlichen App-Build und erzeugen keine Punkte, XP, Note oder Lernbewertung.",
  readyCount: (count) => `${count}/8 Dokumente lokal`,
  choose: "Deutsch-PDFs auswählen",
  checking: "Dateien werden geprüft …",
  importAria: "Deutsch-Prüfungs-PDFs 2024 und 2025 auswählen",
  imported: (count) => `${count} ${count === 1 ? "Dokument gespeichert" : "Dokumente gespeichert"}.`,
  rejected: (count) => `${count} ${count === 1 ? "Datei wurde" : "Dateien wurden"} nicht erkannt.`,
  failure: "Die Deutsch-PDFs konnten nicht importiert werden.",
  yearsAria: "Private Deutsch-Quellen nach Jahr",
  localCount: (count) => `${count}/4 vorhanden`,
  facts: "45 Min. Sprachprüfung · 60 Min. Aufsatz",
  sourceOnly: "Originalquelle · keine automatische Auswertung",
  missing: (label) => `${label} fehlt`,
  openDocument: (label, year) => `${label} ${year} öffnen`,
  readerEyebrow: "LOKALER PDF-LESER",
  readerBody: "Nur zum Lesen und gemeinsamen Vergleichen. Ergebnisse und Teilpunkte bleiben menschliche Arbeit.",
  close: "Leser schliessen",
  chooseDocumentAria: "Dokument wählen",
  pageNavigationAria: "PDF-Seitennavigation",
  previousPage: "Vorherige Seite",
  nextPage: "Nächste Seite",
  pageOf: (page, total) => `Seite ${page} von ${total}`,
  checksum: "Inhalt per SHA-256 geprüft",
  documentLabels: {
    "language-exam": "Sprachprüfung",
    solutions: "Lösungen",
    "text-sheet": "Textblatt",
    "essay-prompts": "Aufsatzthemen",
  },
}

const en: GermanSourceArchiveUiCopy = {
  ...de,
  eyebrow: "PRIVATE GERMAN SOURCES · THIS DEVICE ONLY",
  title: "Original 2024 and 2025 materials",
  body: "Import the language exam, solutions, text sheet, and essay prompts together. GymiQuest recognises file content even after renaming.",
  privacy: "The PDFs stay in this browser, are excluded from backups and the public app build, and generate no points, XP, grade, or learning evidence.",
  readyCount: (count) => `${count}/8 documents local`,
  choose: "Choose German PDFs",
  checking: "Checking files …",
  importAria: "Choose 2024 and 2025 German exam PDFs",
  imported: (count) => `${count} ${count === 1 ? "document" : "documents"} saved.`,
  rejected: (count) => `${count} ${count === 1 ? "file was" : "files were"} not recognised.`,
  failure: "The German PDFs could not be imported.",
  yearsAria: "Private German sources by year",
  localCount: (count) => `${count}/4 available`,
  facts: "45 min language exam · 60 min essay",
  sourceOnly: "Original source · no automatic evaluation",
  missing: (label) => `${label} missing`,
  openDocument: (label, year) => `Open ${label} ${year}`,
  readerEyebrow: "LOCAL PDF READER",
  readerBody: "For reading and shared comparison only. Results and partial credit remain human work.",
  close: "Close reader",
  chooseDocumentAria: "Choose document",
  pageNavigationAria: "PDF page navigation",
  previousPage: "Previous page",
  nextPage: "Next page",
  pageOf: (page, total) => `Page ${page} of ${total}`,
  checksum: "Content verified by SHA-256",
  documentLabels: {
    "language-exam": "Language exam",
    solutions: "Solutions",
    "text-sheet": "Text sheet",
    "essay-prompts": "Essay prompts",
  },
}

const it: GermanSourceArchiveUiCopy = {
  ...en,
  eyebrow: "FONTI PRIVATE DI TEDESCO · SOLO SU QUESTO DISPOSITIVO",
  title: "Materiali originali 2024 e 2025",
  body: "Importa insieme prova linguistica, soluzioni, testo e tracce. GymiQuest riconosce il contenuto anche se i file sono stati rinominati.",
  privacy: "I PDF restano in questo browser, sono esclusi dai backup e dall'app pubblica e non producono punti, XP, voto o valutazione.",
  readyCount: (count) => `${count}/8 documenti locali`,
  choose: "Scegli PDF di tedesco",
  checking: "Controllo dei file …",
  importAria: "Scegli i PDF dell'esame di tedesco 2024 e 2025",
  imported: (count) => `${count} ${count === 1 ? "documento salvato" : "documenti salvati"}.`,
  rejected: (count) => `${count} ${count === 1 ? "file non riconosciuto" : "file non riconosciuti"}.`,
  failure: "Non è stato possibile importare i PDF di tedesco.",
  yearsAria: "Fonti private di tedesco per anno",
  localCount: (count) => `${count}/4 disponibili`,
  facts: "45 min prova linguistica · 60 min tema",
  sourceOnly: "Fonte originale · nessuna valutazione automatica",
  missing: (label) => `${label}: manca`,
  openDocument: (label, year) => `Apri ${label} ${year}`,
  readerEyebrow: "LETTORE PDF LOCALE",
  readerBody: "Solo per leggere e confrontare insieme. Risultati e punteggi parziali restano lavoro umano.",
  close: "Chiudi lettore",
  chooseDocumentAria: "Scegli documento",
  pageNavigationAria: "Navigazione pagine PDF",
  previousPage: "Pagina precedente",
  nextPage: "Pagina successiva",
  pageOf: (page, total) => `Pagina ${page} di ${total}`,
  checksum: "Contenuto verificato con SHA-256",
  documentLabels: {
    "language-exam": "Prova linguistica",
    solutions: "Soluzioni",
    "text-sheet": "Testo",
    "essay-prompts": "Tracce",
  },
}

const es: GermanSourceArchiveUiCopy = {
  ...en,
  eyebrow: "FUENTES PRIVADAS DE ALEMÁN · SOLO EN ESTE DISPOSITIVO",
  title: "Materiales originales de 2024 y 2025",
  body: "Importa juntos el examen lingüístico, las soluciones, el texto y los temas. GymiQuest reconoce el contenido aunque se cambie el nombre del archivo.",
  privacy: "Los PDF permanecen en este navegador, quedan fuera de las copias y de la app pública y no generan puntos, XP, nota ni evaluación.",
  readyCount: (count) => `${count}/8 documentos locales`,
  choose: "Elegir PDF de alemán",
  checking: "Comprobando archivos …",
  importAria: "Elegir los PDF del examen de alemán de 2024 y 2025",
  imported: (count) => `${count} ${count === 1 ? "documento guardado" : "documentos guardados"}.`,
  rejected: (count) => `${count} ${count === 1 ? "archivo no reconocido" : "archivos no reconocidos"}.`,
  failure: "No se han podido importar los PDF de alemán.",
  yearsAria: "Fuentes privadas de alemán por año",
  localCount: (count) => `${count}/4 disponibles`,
  facts: "45 min examen lingüístico · 60 min redacción",
  sourceOnly: "Fuente original · sin evaluación automática",
  missing: (label) => `Falta ${label}`,
  openDocument: (label, year) => `Abrir ${label} ${year}`,
  readerEyebrow: "LECTOR PDF LOCAL",
  readerBody: "Solo para leer y comparar juntos. Los resultados y puntos parciales siguen siendo trabajo humano.",
  close: "Cerrar lector",
  chooseDocumentAria: "Elegir documento",
  pageNavigationAria: "Navegación de páginas PDF",
  previousPage: "Página anterior",
  nextPage: "Página siguiente",
  pageOf: (page, total) => `Página ${page} de ${total}`,
  checksum: "Contenido verificado mediante SHA-256",
  documentLabels: {
    "language-exam": "Examen lingüístico",
    solutions: "Soluciones",
    "text-sheet": "Texto",
    "essay-prompts": "Temas de redacción",
  },
}

export const germanSourceArchiveUiCopy: Record<AppLocale, GermanSourceArchiveUiCopy> = {
  de,
  en,
  it,
  es,
}
