import { questionDiagnosticKindIds, type LearnerState, type LearningLocale, type QuestionDiagnosticEvidence, type QuestionDiagnosticKind, type TopicId } from "./model"

export interface QuestionDiagnosticDraft {
  kind: QuestionDiagnosticKind
  title: string
}

export interface DiagnosticKindCopy {
  label: string
  description: string
  nextMove: string
}

export const diagnosticKindCopy: Record<QuestionDiagnosticKind, DiagnosticKindCopy> = {
  format: {
    label: "Eingabe klar machen",
    description: "Die mathematische Idee kann stimmen, aber das Antwortformat war noch nicht prüfbar.",
    nextMove: "Antwortfeld, Einheit und verlangte Schreibweise vor dem Absenden kurz prüfen.",
  },
  "unit-conversion": {
    label: "Einheitenrichtung",
    description: "Beim Wechsel der Einheit wurde die Zahl in die falsche Richtung verändert.",
    nextMove: "Vor dem Rechnen entscheiden: Muss die Zahl in der neuen Einheit grösser oder kleiner werden?",
  },
  "fraction-structure": {
    label: "Bruch aufbauen",
    description: "Zähler, Nenner oder vollständiges Kürzen brauchten noch Aufmerksamkeit.",
    nextMove: "Zuerst benennen, was die Teile und was das Ganze sind; danach vollständig kürzen.",
  },
  "incomplete-enumeration": {
    label: "Alle Möglichkeiten finden",
    description: "Die gefundenen Lösungen passten, aber die Menge war noch nicht vollständig.",
    nextMove: "Eine feste Reihenfolge oder Tabelle verwenden und jede Möglichkeit genau einmal abhaken.",
  },
  "stopped-early": {
    label: "Bis zum Ziel weitergehen",
    description: "Ein richtiger Zwischenwert wurde noch nicht zur verlangten Endantwort weitergeführt.",
    nextMove: "Nach jedem Zwischenschritt nochmals lesen, welche Grösse am Schluss gesucht ist.",
  },
  "coordinate-order": {
    label: "x und y ordnen",
    description: "Waagrechte und senkrechte Koordinate wurden vertauscht oder falsch übertragen.",
    nextMove: "Die Abbildungsregel zuerst als (x | y) notieren und beide Stellen getrennt einsetzen.",
  },
  "construction-method": {
    label: "Konstruktion wählen",
    description: "Die geometrische Bedingung verlangte ein anderes Werkzeug oder eine andere Ortslinie.",
    nextMove: "Vor dem Zeichnen klären: Abstand von Punkt, Abstand von Gerade oder gleicher Abstand zu zwei Punkten?",
  },
  "construction-precision": {
    label: "Konstruktion ausrichten",
    description: "Das richtige Werkzeug war gewählt, aber seine Lage lag noch ausserhalb der Toleranz.",
    nextMove: "Bezugspunkt oder Bezugslinie festhalten und die Konstruktion erst danach fein ausrichten.",
  },
  concept: {
    label: "Grundidee festigen",
    description: "Der passende mathematische Ansatz war noch nicht sicher abrufbar.",
    nextMove: "Die Idee an einem einfacheren Beispiel erklären und dann mit neuen Zahlen selbst anwenden.",
  },
}

export const englishDiagnosticKindCopy: Record<QuestionDiagnosticKind, DiagnosticKindCopy> = {
  format: {
    label: "Clarify the entry",
    description: "The mathematical idea may be right, but the answer format was not checkable yet.",
    nextMove: "Briefly check the answer field, unit, and requested notation before submitting.",
  },
  "unit-conversion": {
    label: "Unit direction",
    description: "The number changed in the wrong direction when converting the unit.",
    nextMove: "Before calculating, decide whether the number must become larger or smaller in the new unit.",
  },
  "fraction-structure": {
    label: "Build the fraction",
    description: "The numerator, denominator, or complete simplification needed more attention.",
    nextMove: "First name the parts and the whole, then simplify completely.",
  },
  "incomplete-enumeration": {
    label: "Find every possibility",
    description: "The solutions found were valid, but the set was not complete yet.",
    nextMove: "Use a fixed order or table and tick off every possibility exactly once.",
  },
  "stopped-early": {
    label: "Continue to the target",
    description: "A correct intermediate value was not carried through to the requested final answer.",
    nextMove: "After each intermediate step, reread which quantity is required at the end.",
  },
  "coordinate-order": {
    label: "Order x and y",
    description: "The horizontal and vertical coordinates were swapped or transferred incorrectly.",
    nextMove: "Write the transformation rule as (x | y) first and substitute both positions separately.",
  },
  "construction-method": {
    label: "Choose the construction",
    description: "The geometric condition required a different tool or locus.",
    nextMove: "Before drawing, decide: distance from a point, from a line, or equal distance from two points?",
  },
  "construction-precision": {
    label: "Align the construction",
    description: "The correct tool was chosen, but its position was still outside the tolerance.",
    nextMove: "Hold the reference point or line fixed, then fine-tune the construction.",
  },
  concept: {
    label: "Consolidate the key idea",
    description: "The suitable mathematical approach was not securely available yet.",
    nextMove: "Explain the idea with an easier example, then apply it yourself with new values.",
  },
}

export const italianDiagnosticKindCopy: Record<QuestionDiagnosticKind, DiagnosticKindCopy> = {
  format: {
    label: "Chiarisci l'inserimento",
    description: "L'idea matematica può essere corretta, ma il formato della risposta non era ancora verificabile.",
    nextMove: "Prima di inviare, controlla brevemente il campo, l'unità e la forma richiesta.",
  },
  "unit-conversion": {
    label: "Direzione delle unità",
    description: "Durante la conversione, il numero è cambiato nella direzione sbagliata.",
    nextMove: "Prima di calcolare, decidi se nella nuova unità il numero deve diventare più grande o più piccolo.",
  },
  "fraction-structure": {
    label: "Costruisci la frazione",
    description: "Numeratore, denominatore o riduzione completa richiedevano ancora attenzione.",
    nextMove: "Nomina prima le parti e l'intero, poi riduci completamente la frazione.",
  },
  "incomplete-enumeration": {
    label: "Trova tutte le possibilità",
    description: "Le soluzioni trovate erano valide, ma l'insieme non era ancora completo.",
    nextMove: "Usa un ordine fisso o una tabella e spunta ogni possibilità esattamente una volta.",
  },
  "stopped-early": {
    label: "Continua fino all'obiettivo",
    description: "Un risultato intermedio corretto non è stato portato fino alla risposta finale richiesta.",
    nextMove: "Dopo ogni passaggio intermedio, rileggi quale grandezza è richiesta alla fine.",
  },
  "coordinate-order": {
    label: "Ordina x e y",
    description: "Le coordinate orizzontale e verticale sono state scambiate o riportate in modo errato.",
    nextMove: "Scrivi prima la regola come (x | y) e sostituisci separatamente le due posizioni.",
  },
  "construction-method": {
    label: "Scegli la costruzione",
    description: "La condizione geometrica richiedeva uno strumento o un luogo geometrico diverso.",
    nextMove: "Prima di disegnare, decidi: distanza da un punto, da una retta o uguale distanza da due punti?",
  },
  "construction-precision": {
    label: "Allinea la costruzione",
    description: "Lo strumento era corretto, ma la posizione era ancora fuori dalla tolleranza.",
    nextMove: "Tieni fisso il punto o la retta di riferimento e poi regola con precisione la costruzione.",
  },
  concept: {
    label: "Consolida l'idea chiave",
    description: "Il procedimento matematico adatto non era ancora disponibile con sicurezza.",
    nextMove: "Spiega l'idea con un esempio più semplice, poi applicala da solo con valori nuovi.",
  },
}

export const spanishDiagnosticKindCopy: Record<QuestionDiagnosticKind, DiagnosticKindCopy> = {
  format: {
    label: "Aclarar la entrada",
    description: "La idea matemática puede ser correcta, pero el formato de la respuesta todavía no se podía comprobar.",
    nextMove: "Antes de enviar, comprueba brevemente el campo de respuesta, la unidad y la notación solicitada.",
  },
  "unit-conversion": {
    label: "Dirección de las unidades",
    description: "Al convertir la unidad, el número cambió en la dirección equivocada.",
    nextMove: "Antes de calcular, decide si el número debe hacerse mayor o menor en la nueva unidad.",
  },
  "fraction-structure": {
    label: "Construir la fracción",
    description: "El numerador, el denominador o la simplificación completa necesitaban más atención.",
    nextMove: "Nombra primero las partes y el todo; después simplifica por completo.",
  },
  "incomplete-enumeration": {
    label: "Encontrar todas las posibilidades",
    description: "Las soluciones encontradas eran válidas, pero el conjunto aún no estaba completo.",
    nextMove: "Usa un orden fijo o una tabla y marca cada posibilidad exactamente una vez.",
  },
  "stopped-early": {
    label: "Continuar hasta el objetivo",
    description: "Un valor intermedio correcto no se llevó hasta la respuesta final solicitada.",
    nextMove: "Después de cada paso intermedio, vuelve a leer qué magnitud se pide al final.",
  },
  "coordinate-order": {
    label: "Ordenar x e y",
    description: "Las coordenadas horizontal y vertical se intercambiaron o trasladaron de forma incorrecta.",
    nextMove: "Escribe primero la regla como (x | y) y sustituye las dos posiciones por separado.",
  },
  "construction-method": {
    label: "Elegir la construcción",
    description: "La condición geométrica requería otra herramienta u otro lugar geométrico.",
    nextMove: "Antes de dibujar, decide: ¿distancia a un punto, a una recta o igual distancia a dos puntos?",
  },
  "construction-precision": {
    label: "Alinear la construcción",
    description: "Se eligió la herramienta correcta, pero su posición todavía estaba fuera de la tolerancia.",
    nextMove: "Mantén fijo el punto o la recta de referencia y ajusta después la construcción con precisión.",
  },
  concept: {
    label: "Consolidar la idea clave",
    description: "El enfoque matemático adecuado todavía no estaba disponible con seguridad.",
    nextMove: "Explica la idea con un ejemplo más sencillo y aplícala después por tu cuenta con valores nuevos.",
  },
}

export function diagnosticKindCopyForLanguage(
  kind: QuestionDiagnosticKind,
  locale: LearningLocale,
): DiagnosticKindCopy {
  return locale === "en"
    ? englishDiagnosticKindCopy[kind]
    : locale === "it"
      ? italianDiagnosticKindCopy[kind]
      : locale === "es"
        ? spanishDiagnosticKindCopy[kind]
        : diagnosticKindCopy[kind]
}

const diagnosticPriority: Record<QuestionDiagnosticKind, number> = {
  format: 0,
  "stopped-early": 1,
  "construction-precision": 2,
  concept: 2,
  "fraction-structure": 3,
  "incomplete-enumeration": 3,
  "unit-conversion": 3,
  "coordinate-order": 3,
  "construction-method": 3,
}

const diagnosticLearningImpact = {
  format: "input-validation",
  "unit-conversion": "learning-miss",
  "fraction-structure": "learning-miss",
  "incomplete-enumeration": "learning-miss",
  "stopped-early": "learning-miss",
  "coordinate-order": "learning-miss",
  "construction-method": "learning-miss",
  "construction-precision": "learning-miss",
  concept: "learning-miss",
} as const satisfies Record<
  QuestionDiagnosticKind,
  "input-validation" | "learning-miss"
>

export function isInputValidationDiagnostic(
  diagnostic: Pick<QuestionDiagnosticDraft, "kind"> | undefined,
): boolean {
  return diagnostic !== undefined &&
    diagnosticLearningImpact[diagnostic.kind] === "input-validation"
}

export function chooseQuestionDiagnostic(
  current: QuestionDiagnosticDraft | undefined,
  next: QuestionDiagnosticDraft | undefined,
): QuestionDiagnosticDraft | undefined {
  if (!next) return current
  if (!current || diagnosticPriority[next.kind] > diagnosticPriority[current.kind]) return next
  return current
}

export function completeQuestionDiagnostic(
  diagnostic: QuestionDiagnosticDraft | undefined,
  resolved: boolean,
): QuestionDiagnosticEvidence | undefined {
  if (!diagnostic) return undefined
  return { ...diagnostic, resolved }
}

export interface ErrorPattern {
  kind: QuestionDiagnosticKind
  label: string
  description: string
  nextMove: string
  occurrences: number
  resolvedOccurrences: number
  openOccurrences: number
  topicIds: TopicId[]
  latestAt: string
  latestTitle: string
}

export interface ErrorCompass {
  windowDays: number
  totalOccurrences: number
  resolvedOccurrences: number
  patterns: ErrorPattern[]
}

export function buildErrorCompass(
  learner: LearnerState,
  now = new Date(),
  windowDays = 45,
  locale: LearningLocale = "de",
): ErrorCompass {
  const earliest = now.getTime() - windowDays * 24 * 60 * 60 * 1000
  const byKind = new Map<QuestionDiagnosticKind, ErrorPattern>()

  for (const event of learner.learningEvents) {
    if (event.taskKind === "placement" || Date.parse(event.completedAt) < earliest) continue
    for (const result of event.questionResults) {
      const diagnostic = result.diagnostic
      if (!diagnostic) continue
      const copy = diagnosticKindCopyForLanguage(diagnostic.kind, locale)
      const current = byKind.get(diagnostic.kind) ?? {
        kind: diagnostic.kind,
        label: copy.label,
        description: copy.description,
        nextMove: copy.nextMove,
        occurrences: 0,
        resolvedOccurrences: 0,
        openOccurrences: 0,
        topicIds: [],
        latestAt: event.completedAt,
        latestTitle: locale === "de" ? diagnostic.title : copy.label,
      }
      current.occurrences += 1
      current.resolvedOccurrences += diagnostic.resolved ? 1 : 0
      current.openOccurrences += diagnostic.resolved ? 0 : 1
      if (!current.topicIds.includes(result.topicId)) current.topicIds.push(result.topicId)
      if (event.completedAt >= current.latestAt) {
        current.latestAt = event.completedAt
        current.latestTitle = locale === "de" ? diagnostic.title : copy.label
      }
      byKind.set(diagnostic.kind, current)
    }
  }

  const patterns = questionDiagnosticKindIds
    .flatMap((kind) => byKind.get(kind) ?? [])
    .sort((left, right) => (
      right.openOccurrences - left.openOccurrences ||
      right.occurrences - left.occurrences ||
      right.latestAt.localeCompare(left.latestAt)
    ))

  return {
    windowDays,
    totalOccurrences: patterns.reduce((sum, pattern) => sum + pattern.occurrences, 0),
    resolvedOccurrences: patterns.reduce((sum, pattern) => sum + pattern.resolvedOccurrences, 0),
    patterns,
  }
}
