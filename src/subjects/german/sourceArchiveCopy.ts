import type { AppLocale } from "../../i18n/localization"
import type { GermanSourceArchiveImportRejectionCode } from "../../infra/germanSourceArchive"
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
  rejection: (filename: string, code: GermanSourceArchiveImportRejectionCode) => string
  failure: string
  yearsAria: string
  chooseYear: string
  localCount: (count: number, total: number) => string
  facts: (taskCount: number, maxPoints: number) => string
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
  title: "Originalunterlagen 2015–2026",
  body: "Importiere Sprachprüfung, Lösungen, Textblatt, Aufsatzthemen und vorhandene Korrekturhinweise gemeinsam. GymiQuest erkennt die Dateien am Inhalt, auch wenn sie umbenannt wurden.",
  privacy: "Die PDFs bleiben in diesem Browser, gelangen weder in ein Backup noch in den öffentlichen App-Build und erzeugen keine Punkte, XP, Note oder Lernbewertung.",
  readyCount: (count) => `${count} ${count === 1 ? "Dokument" : "Dokumente"} lokal`,
  choose: "Deutsch-PDFs auswählen",
  checking: "Dateien werden geprüft …",
  importAria: "Deutsch-Prüfungs-PDFs 2015 bis 2026 auswählen",
  imported: (count) => `${count} ${count === 1 ? "Dokument gespeichert" : "Dokumente gespeichert"}.`,
  rejected: (count) => `${count} ${count === 1 ? "Datei wurde" : "Dateien wurden"} nicht erkannt.`,
  rejection: (filename, code) => `${filename}: ${({
    "crypto-unavailable": "Dieser Browser kann die PDF nicht sicher prüfen.",
    "not-a-pdf": "Die Datei ist keine lesbare PDF.",
    "wrong-document": "Die Datei gehört nicht zum registrierten Deutsch-Archiv.",
    unknown: "Die Datei konnte nicht geprüft werden.",
  } satisfies Record<GermanSourceArchiveImportRejectionCode, string>)[code]}`,
  failure: "Die Deutsch-PDFs konnten nicht importiert werden.",
  yearsAria: "Private Deutsch-Quellen nach Jahr",
  chooseYear: "Prüfungsjahr",
  localCount: (count, total) => `${count}/${total} vorhanden`,
  facts: (taskCount, maxPoints) => `45 Min. · ${taskCount} Aufgaben · ${maxPoints} Prüfungspunkte`,
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
    "essay-guidance": "Korrekturhinweise",
  },
}

const en: GermanSourceArchiveUiCopy = {
  ...de,
  eyebrow: "PRIVATE GERMAN SOURCES · THIS DEVICE ONLY",
  title: "Original 2015–2026 materials",
  body: "Import the language exam, solutions, text sheet, essay prompts, and any supplied correction guidance together. GymiQuest recognises file content even after renaming.",
  privacy: "The PDFs stay in this browser, are excluded from backups and the public app build, and generate no points, XP, grade, or learning evidence.",
  readyCount: (count) => `${count} ${count === 1 ? "document" : "documents"} local`,
  choose: "Choose German PDFs",
  checking: "Checking files …",
  importAria: "Choose 2015 to 2026 German exam PDFs",
  imported: (count) => `${count} ${count === 1 ? "document" : "documents"} saved.`,
  rejected: (count) => `${count} ${count === 1 ? "file was" : "files were"} not recognised.`,
  rejection: (filename, code) => `${filename}: ${({
    "crypto-unavailable": "This browser cannot verify the PDF securely.",
    "not-a-pdf": "The file is not a readable PDF.",
    "wrong-document": "The file is not part of the registered German archive.",
    unknown: "The file could not be checked.",
  } satisfies Record<GermanSourceArchiveImportRejectionCode, string>)[code]}`,
  failure: "The German PDFs could not be imported.",
  yearsAria: "Private German sources by year",
  chooseYear: "Exam year",
  localCount: (count, total) => `${count}/${total} available`,
  facts: (taskCount, maxPoints) => `45 min · ${taskCount} tasks · ${maxPoints} exam points`,
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
    "essay-guidance": "Correction guidance",
  },
}

const it: GermanSourceArchiveUiCopy = {
  ...en,
  eyebrow: "FONTI PRIVATE DI TEDESCO · SOLO SU QUESTO DISPOSITIVO",
  title: "Materiali originali 2015–2026",
  body: "Importa insieme prova linguistica, soluzioni, testo, tracce ed eventuali indicazioni di correzione. GymiQuest riconosce il contenuto anche se i file sono stati rinominati.",
  privacy: "I PDF restano in questo browser, sono esclusi dai backup e dall'app pubblica e non producono punti, XP, voto o valutazione.",
  readyCount: (count) => `${count} ${count === 1 ? "documento locale" : "documenti locali"}`,
  choose: "Scegli PDF di tedesco",
  checking: "Controllo dei file …",
  importAria: "Scegli i PDF dell'esame di tedesco dal 2015 al 2026",
  imported: (count) => `${count} ${count === 1 ? "documento salvato" : "documenti salvati"}.`,
  rejected: (count) => `${count} ${count === 1 ? "file non riconosciuto" : "file non riconosciuti"}.`,
  rejection: (filename, code) => `${filename}: ${({
    "crypto-unavailable": "Questo browser non può verificare il PDF in modo sicuro.",
    "not-a-pdf": "Il file non è un PDF leggibile.",
    "wrong-document": "Il file non appartiene all'archivio di tedesco registrato.",
    unknown: "Non è stato possibile verificare il file.",
  } satisfies Record<GermanSourceArchiveImportRejectionCode, string>)[code]}`,
  failure: "Non è stato possibile importare i PDF di tedesco.",
  yearsAria: "Fonti private di tedesco per anno",
  chooseYear: "Anno d'esame",
  localCount: (count, total) => `${count}/${total} disponibili`,
  facts: (taskCount, maxPoints) => `45 min · ${taskCount} esercizi · ${maxPoints} punti d'esame`,
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
    "essay-guidance": "Indicazioni di correzione",
  },
}

const es: GermanSourceArchiveUiCopy = {
  ...en,
  eyebrow: "FUENTES PRIVADAS DE ALEMÁN · SOLO EN ESTE DISPOSITIVO",
  title: "Materiales originales de 2015–2026",
  body: "Importa juntos el examen lingüístico, las soluciones, el texto, los temas y las indicaciones de corrección disponibles. GymiQuest reconoce el contenido aunque se cambie el nombre del archivo.",
  privacy: "Los PDF permanecen en este navegador, quedan fuera de las copias y de la app pública y no generan puntos, XP, nota ni evaluación.",
  readyCount: (count) => `${count} ${count === 1 ? "documento local" : "documentos locales"}`,
  choose: "Elegir PDF de alemán",
  checking: "Comprobando archivos …",
  importAria: "Elegir los PDF del examen de alemán de 2015 a 2026",
  imported: (count) => `${count} ${count === 1 ? "documento guardado" : "documentos guardados"}.`,
  rejected: (count) => `${count} ${count === 1 ? "archivo no reconocido" : "archivos no reconocidos"}.`,
  rejection: (filename, code) => `${filename}: ${({
    "crypto-unavailable": "Este navegador no puede verificar el PDF de forma segura.",
    "not-a-pdf": "El archivo no es un PDF legible.",
    "wrong-document": "El archivo no pertenece al archivo de alemán registrado.",
    unknown: "No se ha podido comprobar el archivo.",
  } satisfies Record<GermanSourceArchiveImportRejectionCode, string>)[code]}`,
  failure: "No se han podido importar los PDF de alemán.",
  yearsAria: "Fuentes privadas de alemán por año",
  chooseYear: "Año de examen",
  localCount: (count, total) => `${count}/${total} disponibles`,
  facts: (taskCount, maxPoints) => `45 min · ${taskCount} ejercicios · ${maxPoints} puntos de examen`,
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
    "essay-guidance": "Indicaciones de corrección",
  },
}

export const germanSourceArchiveUiCopy: Record<AppLocale, GermanSourceArchiveUiCopy> = {
  de,
  en,
  it,
  es,
}
