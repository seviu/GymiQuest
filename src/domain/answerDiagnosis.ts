import type { GeneratedQuestion, QuestionDiagnosticKind, TopicId } from "./model"
import {
  isZeroDenominatorFractionAnswer,
  isCorrectAnswer,
  parseCoordinateAnswer,
  parseFractionAnswer,
  parseIntegerSequenceAnswer,
  parseIntegerSetAnswer,
  parseNumericAnswer,
} from "./generators"

export interface AnswerDiagnosis {
  kind: QuestionDiagnosticKind
  title: string
  message: string
  nextStep: string
}

export interface TopicGuidance {
  title: string
  message: string
  nextStep: string
}

const topicGuidance: Record<TopicId, TopicGuidance> = {
  "arithmetic-equations": {
    title: "Prüfe die Rechenrichtung.",
    message: "Wenn der Startwert gesucht ist, gehst du vom Ergebnis rückwärts durch die Rechenkette.",
    nextStep: "Mache die letzte Operation zuerst mit ihrer Gegenoperation rückgängig.",
  },
  "efficient-arithmetic": {
    title: "Suche vor dem Rechnen nach der gemeinsamen Zahl.",
    message: "Wenn derselbe Faktor in beiden Produkten steckt, lassen sich Summe oder Differenz zuerst vereinfachen.",
    nextStep: "Klammere den gemeinsamen Faktor aus und berechne zuerst die Klammer.",
  },
  "mass-units": {
    title: "Prüfe die 1000er-Richtung.",
    message: "Kilogramm und Gramm beschreiben dieselbe Masse, aber mit unterschiedlich grossen Zahlen.",
    nextStep: "kg → g: mal 1000. g → kg: durch 1000.",
  },
  "fraction-of-quantity": {
    title: "Der Nenner kommt zuerst.",
    message: "Der Nenner teilt das Ganze in gleich grosse Teile; der Zähler sagt, wie viele davon du brauchst.",
    nextStep: "Teile die ganze Menge durch den Nenner und multipliziere danach mit dem Zähler.",
  },
  "time-fractions": {
    title: "Bringe alles in dieselbe Einheit.",
    message: "Stunden und Minuten lassen sich erst sicher als Bruchteil berechnen, wenn sie dieselbe Einheit haben.",
    nextStep: "Wandle die ganze Zeitspanne zuerst in Minuten um.",
  },
  "speed-distance-time": {
    title: "Verbinde Strecke, Zeit und Geschwindigkeit.",
    message: "Bei mehreren Abschnitten entsteht der Durchschnitt aus der gesamten Strecke und der gesamten Zeit.",
    nextStep: "Berechne zuerst die Dauer jedes Abschnitts mit Zeit = Strecke : Geschwindigkeit.",
  },
  "data-tables": {
    title: "Prüfe Zeile und Spalte vor der Rechnung.",
    message: "In einer Tabelle gehört jede Zahl gleichzeitig zu einer Zeile und einer Spalte. Nur die Zellen zur gestellten Frage dürfen in die Rechnung.",
    nextStep: "Markiere die passenden Überschriften und entscheide dann: Total, Differenz, Rest oder fehlender Mittelwert?",
  },
  "money-calculations": {
    title: "Trenne Preis und Anzahl.",
    message: "Jede Gruppe trägt ihre Anzahl mal ihren Preis zur Gesamtsumme bei.",
    nextStep: "Berechne jede Gruppe einzeln und addiere erst am Schluss.",
  },
  "proportional-revenue": {
    title: "Arbeite zuerst mit dem Restbetrag.",
    message: "Bekannte Einnahmen gehören nicht mehr zu dem Teil, der im gegebenen Verhältnis aufgeteilt wird.",
    nextStep: "Ziehe die bekannten Einnahmen ab und bilde danach ein vollständiges Verhältnis-Paket.",
  },
  "integer-combinations": {
    title: "Zähle systematisch statt zu raten.",
    message: "Eine Kombination darf weder fehlen noch doppelt gezählt werden.",
    nextStep: "Halte die Anzahl der grössten Münze fest und berechne alle möglichen Reste der Reihe nach.",
  },
  "number-constraints": {
    title: "Prüfe jede Bedingung als eigenen Filter.",
    message: "Eine vollständige Lösungsmenge enthält jede passende Zahl genau einmal und keine unpassende Zahl.",
    nextStep: "Beginne mit der Teilbarkeit, setze danach die gemäss Aufgabe erlaubten Ziffern ein und prüfe zuletzt die Stellenbedingung.",
  },
  "area-fractions": {
    title: "Vergleiche Teilfläche und Gesamtfläche.",
    message: "Der Bruch beschreibt bedeckte Einheitsflächen im Verhältnis zu allen Einheitsflächen.",
    nextStep: "Zähle zuerst alle Felder, dann die bedeckten, und kürze den Bruch.",
  },
  "composite-areas": {
    title: "Trenne Aussenform und Ausschnitt.",
    message: "Eine zusammengesetzte Fläche lässt sich aus bekannten Rechtecken aufbauen oder durch Subtraktion berechnen.",
    nextStep: "Berechne zuerst das Aussenrechteck und danach den Ausschnitt; beim Umfang verfolgst du den Rand.",
  },
  "tiling-costs": {
    title: "Trenne die Geometrie von den Kosten.",
    message: "Zuerst muss klar sein, wie viele Platten passen; erst danach werden die Preise verglichen.",
    nextStep: "Bestimme Reihen und Spalten jeder Plattengrösse und berechne dann die Gesamtkosten.",
  },
  "reverse-fractions": {
    title: "Gehe vom Teil zurück zum Ganzen.",
    message: "Die bekannte Menge entspricht dem Zähler, nicht dem ganzen Bruch.",
    nextStep: "Teile zuerst durch den Zähler und multipliziere den Wert eines Teils mit dem Nenner.",
  },
  "reverse-chains": {
    title: "Starte beim sicheren Endwert.",
    message: "Bei einer Rückwärtskette werden die Veränderungen in umgekehrter Reihenfolge rückgängig gemacht.",
    nextStep: "Berechne zuerst den Inhalt aller Gläser und gehe dann Schritt für Schritt rückwärts.",
  },
  "inverse-proportion": {
    title: "Die Personentage bleiben gleich.",
    message: "Mehr Personen verbrauchen denselben Vorrat in weniger Tagen; Personen mal Tage bleibt konstant.",
    nextStep: "Berechne zuerst alle Personentage und teile sie durch die neue Personenzahl.",
  },
  "changing-rates": {
    title: "Ziehe den ersten Verbrauch zuerst ab.",
    message: "Nach der ersten Phase ist nur noch ein Teil der ursprünglichen Personentage übrig.",
    nextStep: "Gesamtvorrat minus verbrauchte Personentage; den Rest durch die neue Personenzahl teilen.",
  },
  "geometric-loci": {
    title: "Übersetze die Abstandsbedingung.",
    message: "Abstand von einem Punkt, von einer Geraden und gleicher Abstand zu zwei Punkten ergeben verschiedene Ortslinien.",
    nextStep: "Frage zuerst: Kreis, Parallele oder Mittelsenkrechte?",
  },
  "coordinate-transformations": {
    title: "Wende die Regel getrennt auf x und y an.",
    message: "Bei Spiegelungen und Drehungen können Koordinaten ihr Vorzeichen oder ihren Platz wechseln. Die Reihenfolge im Punkt bleibt immer x vor y.",
    nextStep: "Schreibe zuerst die Regel mit (x | y) auf und setze danach beide Ausgangswerte ein.",
  },
  "cube-nets": {
    title: "Falte nur eine gemeinsame Kante auf einmal.",
    message: "Direkt benachbarte Felder bleiben Nachbarflächen. Gegenüber liegt erst eine Fläche, die nach dem Falten in die entgegengesetzte Raumrichtung zeigt.",
    nextStep: "Halte die markierte Fläche fest, klappe ihre Nachbarn hoch und suche danach den Deckel in Gegenrichtung.",
  },
  "spatial-rolling": {
    title: "Verfolge eine Kippkante nach der anderen.",
    message: "Die Seitenfläche hinter der Kippkante wird unten; zugleich ändern sich alle drei Seitenpositionen.",
    nextStep: "Schreibe nach jedem Schritt unten, links, rechts und hinten neu auf, bevor du weiterkippst.",
  },
  "cuboid-surface": {
    title: "Bestimme zuerst alle drei Kanten.",
    message: "Die Oberfläche kann erst berechnet werden, wenn Länge, Breite und Höhe eines Moduls feststehen.",
    nextStep: "Nutze zuerst die Gesamtmasse und das Volumen; addiere danach die drei Rechteckflächen je zweimal.",
  },
}

export function getTopicGuidance(topicId: TopicId): TopicGuidance {
  return topicGuidance[topicId]
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a
}

function approximatelyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(1e-8, Math.abs(right) * 1e-8)
}

function formatDiagnosis(question: GeneratedQuestion): AnswerDiagnosis {
  const guidance = topicGuidance[question.topicId]
  return { kind: "concept", ...guidance }
}

export function diagnoseWrongAnswer(
  question: GeneratedQuestion,
  answer: string,
): AnswerDiagnosis | undefined {
  if (isCorrectAnswer(question, answer)) return undefined

  if (question.response.kind === "number") {
    const parsed = parseNumericAnswer(answer)
    if (parsed === undefined) {
      const unitNote = question.response.unit
        ? ` Die Einheit ${question.response.unit} steht schon neben dem Eingabefeld.`
        : ""
      return {
        kind: "format",
        title: "Diese Eingabe ist noch keine Zahl.",
        message: `Schreibe nur die Zahl; Dezimalkomma und Dezimalpunkt funktionieren beide.${unitNote}`,
        nextStep: "Entferne Wörter oder Einheiten aus dem Feld und prüfe nochmals.",
      }
    }

    const expected = question.response.value
    if (
      question.topicId === "mass-units" &&
      expected !== 0 &&
      parsed !== 0 &&
      (approximatelyEqual(Math.abs(parsed / expected), 1000) ||
        approximatelyEqual(Math.abs(parsed / expected), 0.001))
    ) {
      const toGrams = question.response.unit === "g"
      return {
        kind: "unit-conversion",
        title: "Die 1000er-Richtung ist vertauscht.",
        message: toGrams
          ? "In Gramm braucht dieselbe Masse eine grössere Zahl als in Kilogramm."
          : "In Kilogramm braucht dieselbe Masse eine kleinere Zahl als in Gramm.",
        nextStep: toGrams ? "Multipliziere den kg-Wert mit 1000." : "Teile den g-Wert durch 1000.",
      }
    }

    if (parsed < 0 && expected >= 0) {
      return {
        kind: "concept",
        title: "Das Ergebnis kann hier nicht negativ sein.",
        message: "Gesucht ist eine Anzahl, Dauer, Masse, Fläche oder ein Preis.",
        nextStep: topicGuidance[question.topicId].nextStep,
      }
    }

    if (
      typeof question.visual?.fromValue === "number" &&
      !approximatelyEqual(question.visual.fromValue, expected) &&
      approximatelyEqual(parsed, question.visual.fromValue)
    ) {
      return {
        kind: "stopped-early",
        title: "Du bist bei einem Zwischenwert stehen geblieben.",
        message: "Dieser Wert gehört zur Aufgabe, ist aber noch nicht die gesuchte Endantwort.",
        nextStep: topicGuidance[question.topicId].nextStep,
      }
    }

    return formatDiagnosis(question)
  }

  if (question.response.kind === "fraction") {
    const parsed = parseFractionAnswer(answer)
    if (!parsed) {
      if (isZeroDenominatorFractionAnswer(answer)) {
        return {
          kind: "fraction-structure",
          title: "Ein Nenner darf nicht null sein.",
          message: "Durch null kann man nicht teilen; der eingegebene Ausdruck beschreibt deshalb keinen Bruchwert.",
          nextStep: "Setze die Anzahl der gleich grossen Teile in den Nenner; sie muss grösser als null sein.",
        }
      }
      return {
        kind: "format",
        title: "Schreibe den Bruch mit einem Schrägstrich.",
        message: "Ein Bruch braucht einen Zähler und einen Nenner, zum Beispiel 3/4.",
        nextStep: "Schreibe Zähler/Nenner und prüfe, ob der Nenner grösser als null ist.",
      }
    }

    const equivalent =
      parsed.numerator * question.response.denominator ===
      question.response.numerator * parsed.denominator
    const divisor = greatestCommonDivisor(parsed.numerator, parsed.denominator)
    if (equivalent && question.response.requireSimplified && divisor > 1) {
      const fractionMeaning = question.visual?.kind === "number-line"
        ? question.visual.variant === "fraction-distance"
          ? "genau der richtige Abstand zwischen A und B"
          : question.visual.variant === "fraction-midpoint"
            ? "genau der Bruch in der Mitte zwischen A und B"
            : "das richtige Ergebnis"
        : "das richtige Ergebnis"
      const reducedAnswer = `${question.response.numerator}/${question.response.denominator}`
      return {
        kind: "fraction-structure",
        title: "Der Wert stimmt – kürze den Bruch noch.",
        message: `${parsed.numerator}/${parsed.denominator} ist ${fractionMeaning}, aber noch nicht vollständig gekürzt. Vollständig gekürzt bedeutet: Zähler und Nenner haben keinen gemeinsamen Teiler mehr ausser 1.`,
        nextStep: `Teile beide durch ${divisor}: ${parsed.numerator} : ${divisor} = ${parsed.numerator / divisor} und ${parsed.denominator} : ${divisor} = ${parsed.denominator / divisor}. Schreibe ${reducedAnswer}.`,
      }
    }

    const isReciprocal =
      parsed.numerator * question.response.numerator ===
      parsed.denominator * question.response.denominator
    if (isReciprocal) {
      return {
        kind: "fraction-structure",
        title: "Zähler und Nenner sind vertauscht.",
        message: "Oben stehen die bedeckten Teile, unten alle gleich grossen Teile.",
        nextStep: "Zähle Teilfläche und Gesamtfläche nochmals in dieser Reihenfolge.",
      }
    }

    return formatDiagnosis(question)
  }

  if (question.response.kind === "integer-set") {
    const parsed = parseIntegerSetAnswer(answer)
    if (!parsed) {
      const entries = parseIntegerSequenceAnswer(answer)
      if (entries && new Set(entries).size !== entries.length) {
        return {
          kind: "incomplete-enumeration",
          title: "Eine Zahl steht doppelt in der Liste.",
          message: "Eine Lösungsmenge enthält jede passende Zahl genau einmal.",
          nextStep: "Streiche doppelte Einträge und prüfe danach, ob noch eine passende Zahl fehlt.",
        }
      }
      return {
        kind: "format",
        title: "Schreibe jede Zahl genau einmal.",
        message: "Trenne ganze Zahlen mit Kommas, Semikolons oder Leerzeichen. Wörter und doppelte Einträge gehören nicht in die Lösungsmenge.",
        nextStep: "Beispiel für das Format: 1234, 1324, 2134",
      }
    }

    const expected = new Set(question.response.values)
    const invalidEntries = parsed.filter((value) => !expected.has(value))
    if (invalidEntries.length === 0 && parsed.length < expected.size) {
      return {
        kind: "incomplete-enumeration",
        title: "Die bisherigen Zahlen passen, aber die Liste ist noch nicht vollständig.",
        message: "Mindestens eine weitere Anordnung erfüllt alle Bedingungen.",
        nextStep: "Gehe die erlaubten Ziffern für jede Stelle systematisch durch und prüfe Teilbarkeit, Grenze, Quersumme und Stellenbedingung.",
      }
    }

    return formatDiagnosis(question)
  }

  if (question.response.kind === "integer-sequence") {
    const expected = question.response.values
    const parsed = parseIntegerSequenceAnswer(answer)
    if (!parsed) {
      return {
        kind: "format",
        title: "Für jeden Kipp-Schritt wird eine Fläche gebraucht.",
        message: `Schreibe genau ${expected.length} ganze Zahlen in der Reihenfolge des Weges.`,
        nextStep: "Trenne die Flächen mit Kommas, zum Beispiel 2, 3, 1, 4.",
      }
    }
    if (parsed.length !== expected.length) {
      return {
        kind: parsed.length < expected.length ? "stopped-early" : "concept",
        title: `Der Weg braucht genau ${expected.length} Flächen.`,
        message: parsed.length < expected.length
          ? "Mindestens ein Kipp-Schritt fehlt noch."
          : "Die Liste enthält mehr Flächen als der eingezeichnete Weg Kipp-Schritte hat.",
        nextStep: "Gehe den Weg Pfeil für Pfeil durch und notiere nach jedem Kippen genau eine Grundfläche.",
      }
    }

    const firstWrong = parsed.findIndex((entry, index) => entry !== expected[index])
    return {
      kind: "concept",
      title: `Prüfe den ${firstWrong + 1}. Kipp-Schritt.`,
      message: "Nach jedem Kippen ändern sich Grundfläche und alle drei Seitenpositionen.",
      nextStep: "Übertrage zuerst die vollständige neue Orientierung und kippe erst danach weiter.",
    }
  }

  if (question.response.kind === "coordinate") {
    const parsed = parseCoordinateAnswer(answer)
    if (!parsed) {
      return {
        kind: "format",
        title: "Beide Koordinaten werden gebraucht.",
        message: "Trage eine Zahl für x und eine Zahl für y ein. Dezimalkomma und Dezimalpunkt funktionieren in beiden Feldern.",
        nextStep: "Lies den Punkt immer als (x | y): zuerst waagrecht, dann senkrecht.",
      }
    }
    if (parsed.x === question.response.y && parsed.y === question.response.x) {
      return {
        kind: "coordinate-order",
        title: "x und y sind vertauscht.",
        message: "Die erste Koordinate beschreibt die waagrechte, die zweite die senkrechte Richtung.",
        nextStep: "Schreibe das Resultat nochmals in der Reihenfolge (x | y).",
      }
    }
    return formatDiagnosis(question)
  }

  return formatDiagnosis(question)
}
