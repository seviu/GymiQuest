import type { TopicId } from "../../domain/model"

/**
 * School practice catalog for Kanton Zürich, 6. Klasse Primarschule.
 * Mirrors the canonical themes of the obligatory Lehrmittel
 * «Mathematik 6 Primarstufe» (Lehrmittelverlag Zürich), in the school-year
 * order of the official Jahresplanung — the student picks the theme her
 * class is covering. Theme and Bereich names stay German on purpose:
 * they are the book's own terms.
 *
 * topicIds lists only generators that genuinely drill the theme; a theme
 * with no coverage stays visible with topicIds: [] so the gap is honest.
 * Sources: Lehrmittelverzeichnis 2026/27 (Bildungsrat, 1.12.2025) and the
 * LMVZ Jahresplanung «Mathematik 6 Primarstufe».
 */
export type SchoolAreaId = "zahlen" | "rechenoperationen" | "geometrie" | "groessen-daten"

export const schoolAreaTitles: Record<SchoolAreaId, string> = {
  zahlen: "Zahlen",
  rechenoperationen: "Rechenoperationen",
  geometrie: "Geometrie",
  "groessen-daten": "Grössen und Daten",
}

export interface SchoolTheme {
  /** Position 1–36 in the Jahresplanung (school-year order). */
  number: number
  /** Canonical theme name from the Lehrmittel. */
  title: string
  /** Rough timing from the Jahresplanung, e.g. "Sept/Okt". */
  months: string
  area: SchoolAreaId
  topicIds: TopicId[]
}

export const schoolThemes: SchoolTheme[] = [
  { number: 1, title: "Brüche", months: "Aug", area: "zahlen", topicIds: ["area-fractions"] },
  { number: 2, title: "Teiler und Vielfache", months: "Aug", area: "zahlen", topicIds: [] },
  { number: 3, title: "Erweitern und Kürzen", months: "Aug/Sept", area: "zahlen", topicIds: [] },
  { number: 4, title: "Raster und Koordinaten", months: "Sept", area: "geometrie", topicIds: ["coordinate-transformations"] },
  { number: 5, title: "Dezimalzahlen", months: "Sept", area: "zahlen", topicIds: [] },
  { number: 6, title: "Brüche und Dezimalzahlen", months: "Sept/Okt", area: "zahlen", topicIds: [] },
  { number: 7, title: "Zahlen ordnen", months: "Sept/Okt", area: "zahlen", topicIds: [] },
  { number: 8, title: "Proportionalität", months: "Okt", area: "groessen-daten", topicIds: ["proportional-revenue"] },
  { number: 9, title: "Umgekehrte Proportionalität", months: "Okt/Nov", area: "groessen-daten", topicIds: ["inverse-proportion"] },
  { number: 10, title: "Wertepaare und Wertetabellen", months: "Nov", area: "groessen-daten", topicIds: ["data-tables"] },
  { number: 11, title: "Linien", months: "Nov", area: "geometrie", topicIds: [] },
  { number: 12, title: "Addieren und Subtrahieren", months: "Nov/Dez", area: "rechenoperationen", topicIds: [] },
  { number: 13, title: "Multiplizieren und Dividieren", months: "Nov/Dez", area: "rechenoperationen", topicIds: [] },
  { number: 14, title: "Überschlagen", months: "Dez", area: "rechenoperationen", topicIds: [] },
  { number: 15, title: "Flexibel rechnen", months: "Dez", area: "rechenoperationen", topicIds: ["efficient-arithmetic"] },
  { number: 16, title: "Formen", months: "Dez/Jan", area: "geometrie", topicIds: [] },
  { number: 17, title: "Flächen", months: "Jan", area: "groessen-daten", topicIds: ["composite-areas", "tiling-costs"] },
  { number: 18, title: "Volumen", months: "Jan", area: "groessen-daten", topicIds: ["cuboid-surface"] },
  { number: 19, title: "Textaufgaben", months: "Jan/Feb", area: "groessen-daten", topicIds: ["money-calculations"] },
  { number: 20, title: "Grundkonstruktionen", months: "Jan/Feb", area: "geometrie", topicIds: ["geometric-loci"] },
  { number: 21, title: "Anteile", months: "Feb", area: "zahlen", topicIds: ["fraction-of-quantity", "reverse-fractions", "time-fractions"] },
  { number: 22, title: "Brüche und Rechnungen", months: "Feb/März", area: "zahlen", topicIds: [] },
  { number: 23, title: "Prozente", months: "Feb/März", area: "zahlen", topicIds: [] },
  { number: 24, title: "Zahlen untersuchen", months: "März", area: "zahlen", topicIds: ["number-constraints"] },
  { number: 25, title: "Körper", months: "März/April", area: "geometrie", topicIds: ["cube-nets", "spatial-rolling"] },
  { number: 26, title: "Terme und Klammern", months: "April", area: "rechenoperationen", topicIds: ["arithmetic-equations"] },
  { number: 27, title: "Gleichungen und Unbekannte", months: "April", area: "rechenoperationen", topicIds: ["reverse-chains"] },
  { number: 28, title: "Datenauswertung", months: "April/Mai", area: "groessen-daten", topicIds: [] },
  { number: 29, title: "Kombinatorik", months: "April/Mai", area: "groessen-daten", topicIds: ["integer-combinations"] },
  { number: 30, title: "Sachaufgaben", months: "Mai", area: "groessen-daten", topicIds: ["speed-distance-time", "changing-rates"] },
  { number: 31, title: "Ansichten und Pläne", months: "Mai/Juni", area: "geometrie", topicIds: [] },
  { number: 32, title: "Schätzen", months: "Mai/Juni", area: "groessen-daten", topicIds: [] },
  { number: 33, title: "Diagramme", months: "Juni", area: "groessen-daten", topicIds: [] },
  { number: 34, title: "Zufall und Wahrscheinlichkeit", months: "Juni", area: "groessen-daten", topicIds: [] },
  { number: 35, title: "Symmetrie", months: "Juni/Juli", area: "geometrie", topicIds: [] },
  { number: 36, title: "Regeln und Strategien", months: "Juli", area: "groessen-daten", topicIds: [] },
]

// ponytail: 17 of 36 themes covered, 19 honest gaps — the ZAP generator pool
// has no drills for written arithmetic, percent, diagrams, probability, etc.
// Extend the mapping as generators land; never pad a theme with a loose fit.
