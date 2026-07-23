import {
  diagnosticKindCopyForLanguage,
  type DiagnosticKindCopy,
} from "../domain/errorPatterns"
import {
  diagnoseWrongAnswer,
  getTopicGuidance,
  type AnswerDiagnosis,
  type TopicGuidance,
} from "../domain/answerDiagnosis"
import {
  isCorrectAnswer,
  isZeroDenominatorFractionAnswer,
  parseCoordinateAnswer,
  parseFractionAnswer,
  parseIntegerSequenceAnswer,
  parseIntegerSetAnswer,
  parseNumericAnswer,
} from "../domain/generators"
import type {
  GeneratedQuestion,
  LearningLocale,
  QuestionDiagnosticKind,
  TopicId,
} from "../domain/model"
import { buildParentTopicCoaching } from "../domain/parentCoaching"

export function diagnosticKindCopyForLocale(
  kind: QuestionDiagnosticKind,
  locale: LearningLocale,
): DiagnosticKindCopy {
  return diagnosticKindCopyForLanguage(kind, locale)
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

function localizedText(
  locale: LearningLocale,
  english: string,
  italian: string,
  spanish: string,
): string {
  return locale === "it" ? italian : locale === "es" ? spanish : english
}

export function topicGuidanceForLocale(
  topicId: TopicId,
  locale: LearningLocale,
): TopicGuidance {
  if (locale === "de") return getTopicGuidance(topicId)
  const copy = buildParentTopicCoaching(topicId, locale)
  return {
    title: copy.ideaTitle,
    message: copy.commonHurdle,
    nextStep: copy.nextStep,
  }
}

function conceptDiagnosis(question: GeneratedQuestion, locale: LearningLocale): AnswerDiagnosis {
  return {
    kind: "concept",
    ...topicGuidanceForLocale(question.topicId, locale),
  }
}

export function localizeAnswerDiagnosis(
  diagnosis: AnswerDiagnosis | undefined,
  question: GeneratedQuestion,
  locale: LearningLocale,
): AnswerDiagnosis | undefined {
  if (!diagnosis || locale === "de") return diagnosis
  const guidance = topicGuidanceForLocale(question.topicId, locale)
  const text = (english: string, italian: string, spanish: string) => localizedText(locale, english, italian, spanish)

  switch (diagnosis.kind) {
    case "format":
      return {
        ...diagnosis,
        title: text("Check the answer format.", "Controlla il formato della risposta.", "Comprueba el formato de la respuesta."),
        message: text("Enter only the requested values. Decimal commas and decimal points are both accepted.", "Inserisci soltanto i valori richiesti. Sono accettati sia la virgola sia il punto decimale.", "Introduce solo los valores solicitados. Se aceptan tanto la coma como el punto decimal."),
        nextStep: text("Remove words and units from the answer field, then try again.", "Rimuovi parole e unità dal campo della risposta, poi riprova.", "Quita las palabras y unidades del campo de respuesta y vuelve a intentarlo."),
      }
    case "unit-conversion":
      return {
        ...diagnosis,
        title: text("The direction of the 1,000 conversion is reversed.", "Il verso della conversione per 1'000 è invertito.", "La dirección de la conversión por 1000 está invertida."),
        message: question.response.kind === "number" && question.response.unit === "g"
          ? text("The same mass needs a larger number when written in grams than in kilograms.", "La stessa massa richiede un numero più grande in grammi che in chilogrammi.", "La misma masa necesita un número mayor en gramos que en kilogramos.")
          : text("The same mass needs a smaller number when written in kilograms than in grams.", "La stessa massa richiede un numero più piccolo in chilogrammi che in grammi.", "La misma masa necesita un número menor en kilogramos que en gramos."),
        nextStep: question.response.kind === "number" && question.response.unit === "g"
          ? text("Multiply the kilogram value by 1,000.", "Moltiplica il valore in chilogrammi per 1'000.", "Multiplica el valor en kilogramos por 1000.")
          : text("Divide the gram value by 1,000.", "Dividi il valore in grammi per 1'000.", "Divide el valor en gramos entre 1000."),
      }
    case "fraction-structure":
      return {
        ...diagnosis,
        title: text("Check the numerator, denominator, and simplification.", "Controlla numeratore, denominatore e semplificazione.", "Comprueba el numerador, el denominador y la simplificación."),
        message: text("The numerator counts the selected equal parts; the denominator counts all equal parts.", "Il numeratore conta le parti uguali scelte; il denominatore conta tutte le parti uguali.", "El numerador cuenta las partes iguales elegidas; el denominador cuenta todas las partes iguales."),
        nextStep: text("Write the fraction in that order and simplify numerator and denominator by the same factor.", "Scrivi la frazione in quest'ordine e semplifica numeratore e denominatore per lo stesso fattore.", "Escribe la fracción en ese orden y simplifica el numerador y el denominador por el mismo factor."),
      }
    case "incomplete-enumeration":
      if (diagnosis.title === "Eine Zahl steht doppelt in der Liste.") {
        return {
          ...diagnosis,
          title: text("One number appears twice in the list.", "Un numero compare due volte nell'elenco.", "Un número aparece dos veces en la lista."),
          message: text("A solution set contains each valid number exactly once.", "Un insieme di soluzioni contiene ogni numero valido una sola volta.", "Un conjunto de soluciones contiene cada número válido exactamente una vez."),
          nextStep: text("Remove duplicate entries, then check whether another valid number is still missing.", "Elimina i duplicati, poi controlla se manca ancora un altro numero valido.", "Elimina los duplicados y comprueba si todavía falta otro número válido."),
        }
      }
      return {
        ...diagnosis,
        title: text("Your numbers fit, but the list is not complete yet.", "I tuoi numeri vanno bene, ma l'elenco non è ancora completo.", "Tus números encajan, pero la lista aún no está completa."),
        message: text("At least one more arrangement satisfies every condition.", "Almeno un'altra disposizione soddisfa tutte le condizioni.", "Al menos otra disposición cumple todas las condiciones."),
        nextStep: text("Work systematically through the allowed digits in every place, then check divisibility, the bound, digit sum, and place condition.", "Esamina sistematicamente le cifre consentite in ogni posizione, poi controlla divisibilità, limite, somma delle cifre e condizione sulle posizioni.", "Recorre sistemáticamente las cifras permitidas en cada posición y comprueba la divisibilidad, el límite, la suma de cifras y la condición de posición."),
      }
    case "stopped-early":
      if (question.response.kind === "integer-sequence") {
        return {
          ...diagnosis,
          title: text(
            `The route needs exactly ${question.response.values.length} faces.`,
            `Il percorso richiede esattamente ${question.response.values.length} facce.`,
            `El recorrido necesita exactamente ${question.response.values.length} caras.`,
          ),
          message: text("At least one tilt step is still missing.", "Manca ancora almeno un passaggio di rotolamento.", "Todavía falta al menos un paso de giro."),
          nextStep: text("Follow the arrows one by one and record exactly one base face after every tilt.", "Segui le frecce una alla volta e annota esattamente una faccia di base dopo ogni rotolamento.", "Sigue las flechas una a una y anota exactamente una cara de base después de cada giro."),
        }
      }
      return {
        ...diagnosis,
        title: text("You stopped at an intermediate value.", "Ti sei fermato a un valore intermedio.", "Te has detenido en un valor intermedio."),
        message: text("This value belongs to the exercise, but it is not the requested final answer yet.", "Questo valore appartiene all'esercizio, ma non è ancora la risposta finale richiesta.", "Este valor pertenece al ejercicio, pero todavía no es la respuesta final solicitada."),
        nextStep: guidance.nextStep,
      }
    case "coordinate-order":
      return {
        ...diagnosis,
        title: text("x and y are reversed.", "x e y sono invertite.", "x e y están intercambiadas."),
        message: text("The first coordinate is horizontal and the second coordinate is vertical.", "La prima coordinata è orizzontale e la seconda è verticale.", "La primera coordenada es horizontal y la segunda vertical."),
        nextStep: text("Write the result again in the order (x | y).", "Riscrivi il risultato nell'ordine (x | y).", "Vuelve a escribir el resultado en el orden (x | y)."),
      }
    case "construction-method":
      return {
        ...diagnosis,
        title: text("Choose the construction that matches the distance condition.", "Scegli la costruzione che corrisponde alla condizione sulla distanza.", "Elige la construcción que corresponde a la condición de distancia."),
        message: text("A point, a line, and two points lead to three different kinds of boundary.", "Un punto, una retta e due punti producono tre diversi tipi di luogo geometrico.", "Un punto, una recta y dos puntos producen tres tipos distintos de lugar geométrico."),
        nextStep: text("Ask first: circle, parallel line, or perpendicular bisector?", "Chiediti prima: circonferenza, retta parallela o asse del segmento?", "Pregúntate primero: ¿circunferencia, recta paralela o mediatriz?"),
      }
    case "construction-precision":
      return {
        ...diagnosis,
        title: text("The construction is close, but not precise enough yet.", "La costruzione è vicina, ma non ancora abbastanza precisa.", "La construcción está cerca, pero aún no es suficientemente precisa."),
        message: text("Keep the chosen construction and adjust its distance or position.", "Mantieni la costruzione scelta e regola la distanza o la posizione.", "Mantén la construcción elegida y ajusta su distancia o posición."),
        nextStep: text("Use the fine-adjustment control until the measurement matches the condition.", "Usa il comando di regolazione fine finché la misura non corrisponde alla condizione.", "Usa el control de ajuste fino hasta que la medida cumpla la condición."),
      }
    case "concept":
      return { ...diagnosis, ...guidance }
  }
}

interface SupportIssue {
  title: string
  message: string
  nextStep: string
  stepNumber?: number
}

export function localizeSupportIssue(
  issue: SupportIssue | undefined,
  question: GeneratedQuestion,
  locale: LearningLocale,
  kind: "practice" | "practice-format" | "construction-method" | "construction-precision",
): SupportIssue | undefined {
  if (!issue) return issue
  if (kind === "practice-format") {
    if (locale === "de") {
      return {
        ...issue,
        nextStep: "Entferne Wörter und Einheiten und prüfe den Schritt nochmals.",
      }
    }
    return {
      ...issue,
      title: localizedText(
        locale,
        issue.stepNumber ? `Check the entry in step ${issue.stepNumber}.` : "Check this entry.",
        issue.stepNumber ? `Controlla l'inserimento nel passaggio ${issue.stepNumber}.` : "Controlla questo inserimento.",
        issue.stepNumber ? `Comprueba la entrada del paso ${issue.stepNumber}.` : "Comprueba esta entrada.",
      ),
      message: localizedText(
        locale,
        "Enter only the number. The unit is already shown beside the field.",
        "Inserisci soltanto il numero. L'unità è già indicata accanto al campo.",
        "Introduce solo el número. La unidad ya aparece junto al campo.",
      ),
      nextStep: localizedText(
        locale,
        "Remove words and units, then check the step again.",
        "Rimuovi parole e unità, poi controlla di nuovo il passaggio.",
        "Quita las palabras y las unidades y vuelve a comprobar el paso.",
      ),
    }
  }
  if (locale === "de") return issue
  if (kind === "practice") {
    const step = issue.stepNumber
      ? question.practiceSteps?.[issue.stepNumber - 1]
      : undefined
    return {
      ...issue,
      title: localizedText(
        locale,
        issue.stepNumber ? `Check step ${issue.stepNumber}.` : "Check this calculation step.",
        issue.stepNumber ? `Controlla il passaggio ${issue.stepNumber}.` : "Controlla questo passaggio di calcolo.",
        issue.stepNumber ? `Comprueba el paso ${issue.stepNumber}.` : "Comprueba este paso de cálculo.",
      ),
      message: localizedText(
        locale,
        "This is the first step that does not yet match the calculation path.",
        "Questo è il primo passaggio che non corrisponde ancora al percorso di calcolo.",
        "Este es el primer paso que todavía no coincide con el procedimiento de cálculo.",
      ),
      nextStep: step?.nextStep ?? topicGuidanceForLocale(question.topicId, locale).nextStep,
    }
  }
  const localized = localizeAnswerDiagnosis({
    kind,
    title: issue.title,
    message: issue.message,
    nextStep: issue.nextStep,
  }, question, locale)
  return localized ? {
    title: localized.title,
    message: localized.message,
    nextStep: localized.nextStep,
  } : undefined
}

export function diagnoseWrongAnswerForLocale(
  question: GeneratedQuestion,
  answer: string,
  locale: LearningLocale,
): AnswerDiagnosis | undefined {
  if (locale === "de") return diagnoseWrongAnswer(question, answer)
  if (isCorrectAnswer(question, answer)) return undefined
  const text = (english: string, italian: string, spanish: string) => localizedText(locale, english, italian, spanish)

  if (question.response.kind === "number") {
    const parsed = parseNumericAnswer(answer)
    if (parsed === undefined) {
      const unitNote = question.response.unit
        ? text(
          ` The unit ${question.response.unit} is already shown beside the answer field.`,
          ` L'unità ${question.response.unit} è già indicata accanto al campo della risposta.`,
          ` La unidad ${question.response.unit} ya aparece junto al campo de respuesta.`,
        )
        : ""
      return {
        kind: "format",
        title: text("This entry is not a number yet.", "Questo inserimento non è ancora un numero.", "Esta entrada todavía no es un número."),
        message: text(`Enter only the number; decimal commas and decimal points are both accepted.${unitNote}`, `Inserisci soltanto il numero; sono accettati sia la virgola sia il punto decimale.${unitNote}`, `Introduce solo el número; se aceptan tanto la coma como el punto decimal.${unitNote}`),
        nextStep: text("Remove words or units from the field and try again.", "Rimuovi parole o unità dal campo e riprova.", "Quita las palabras o unidades del campo y vuelve a intentarlo."),
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
      return localizeAnswerDiagnosis({
        kind: "unit-conversion",
        title: "",
        message: "",
        nextStep: "",
      }, question, locale)
    }

    if (
      typeof question.visual?.fromValue === "number" &&
      !approximatelyEqual(question.visual.fromValue, expected) &&
      approximatelyEqual(parsed, question.visual.fromValue)
    ) {
      return localizeAnswerDiagnosis({
        kind: "stopped-early",
        title: "",
        message: "",
        nextStep: "",
      }, question, locale)
    }

    return conceptDiagnosis(question, locale)
  }

  if (question.response.kind === "fraction") {
    const parsed = parseFractionAnswer(answer)
    if (!parsed) {
      if (isZeroDenominatorFractionAnswer(answer)) {
        return {
          kind: "fraction-structure",
          title: text("A denominator cannot be zero.", "Il denominatore non può essere zero.", "El denominador no puede ser cero."),
          message: text("You cannot divide by zero, so this expression does not describe a fraction value.", "Non si può dividere per zero, quindi questa espressione non descrive il valore di una frazione.", "No se puede dividir entre cero, así que esta expresión no describe el valor de una fracción."),
          nextStep: text("Use the number of equal parts as the denominator; it must be greater than zero.", "Usa come denominatore il numero di parti uguali; deve essere maggiore di zero.", "Usa como denominador el número de partes iguales; debe ser mayor que cero."),
        }
      }
      return {
        kind: "format",
        title: text("Write the fraction with a slash.", "Scrivi la frazione con una barra.", "Escribe la fracción con una barra."),
        message: text("A fraction needs a numerator and denominator, for example 3/4.", "Una frazione richiede numeratore e denominatore, per esempio 3/4.", "Una fracción necesita numerador y denominador, por ejemplo 3/4."),
        nextStep: text("Write numerator/denominator and check that the denominator is greater than zero.", "Scrivi numeratore/denominatore e controlla che il denominatore sia maggiore di zero.", "Escribe numerador/denominador y comprueba que el denominador sea mayor que cero."),
      }
    }
    const equivalent = parsed.numerator * question.response.denominator ===
      question.response.numerator * parsed.denominator
    const divisor = greatestCommonDivisor(parsed.numerator, parsed.denominator)
    if (equivalent && question.response.requireSimplified && divisor > 1) {
      return {
        kind: "fraction-structure",
        title: text("The value is correct—simplify the fraction once more.", "Il valore è corretto: semplifica ancora la frazione.", "El valor es correcto; simplifica la fracción una vez más."),
        message: text(`${parsed.numerator}/${parsed.denominator} represents the correct area but is not fully simplified.`, `${parsed.numerator}/${parsed.denominator} rappresenta l'area corretta, ma non è completamente semplificata.`, `${parsed.numerator}/${parsed.denominator} representa el área correcta, pero no está completamente simplificada.`),
        nextStep: text(`Divide the numerator and denominator by ${divisor}.`, `Dividi numeratore e denominatore per ${divisor}.`, `Divide el numerador y el denominador entre ${divisor}.`),
      }
    }
    return conceptDiagnosis(question, locale)
  }

  if (question.response.kind === "integer-set") {
    const parsed = parseIntegerSetAnswer(answer)
    if (!parsed) {
      const entries = parseIntegerSequenceAnswer(answer)
      if (entries && new Set(entries).size !== entries.length) {
        return localizeAnswerDiagnosis({
          kind: "incomplete-enumeration",
          title: "Eine Zahl steht doppelt in der Liste.",
          message: "",
          nextStep: "",
        }, question, locale)
      }
      return {
        kind: "format",
        title: text("Write each number exactly once.", "Scrivi ogni numero una sola volta.", "Escribe cada número una sola vez."),
        message: text("Separate whole numbers with commas, semicolons, or spaces. Do not include words or duplicates.", "Separa i numeri interi con virgole, punti e virgola o spazi. Non inserire parole o duplicati.", "Separa los números enteros con comas, puntos y comas o espacios. No incluyas palabras ni duplicados."),
        nextStep: text("Example format: 1234, 1324, 2134", "Formato di esempio: 1234, 1324, 2134", "Formato de ejemplo: 1234, 1324, 2134"),
      }
    }
    const expected = new Set(question.response.values)
    if (parsed.every((value) => expected.has(value)) && parsed.length < expected.size) {
      return localizeAnswerDiagnosis({
        kind: "incomplete-enumeration",
        title: "",
        message: "",
        nextStep: "",
      }, question, locale)
    }
    return conceptDiagnosis(question, locale)
  }

  if (question.response.kind === "integer-sequence") {
    const expected = question.response.values
    const parsed = parseIntegerSequenceAnswer(answer)
    if (!parsed) {
      return {
        kind: "format",
        title: text("One face is needed for every tipping step.", "Serve una faccia per ogni ribaltamento.", "Se necesita una cara por cada vuelco."),
        message: text(`Enter exactly ${expected.length} whole numbers in path order.`, `Inserisci esattamente ${expected.length} numeri interi nell'ordine del percorso.`, `Introduce exactamente ${expected.length} números enteros en el orden del recorrido.`),
        nextStep: text("Separate the faces with commas, for example 2, 3, 1, 4.", "Separa le facce con virgole, per esempio 2, 3, 1, 4.", "Separa las caras con comas, por ejemplo 2, 3, 1, 4."),
      }
    }
    if (parsed.length !== expected.length) {
      return parsed.length < expected.length
        ? localizeAnswerDiagnosis({
            kind: "stopped-early",
            title: "",
            message: "",
            nextStep: "",
          }, question, locale)
        : conceptDiagnosis(question, locale)
    }
    const firstWrong = parsed.findIndex((entry, index) => entry !== expected[index])
    return {
      kind: "concept",
      title: text(`Check tipping step ${firstWrong + 1}.`, `Controlla il ribaltamento ${firstWrong + 1}.`, `Comprueba el vuelco ${firstWrong + 1}.`),
      message: text("After every tip, the base face and all three side positions change.", "Dopo ogni ribaltamento cambiano la faccia di base e tutte e tre le posizioni laterali.", "Después de cada vuelco cambian la cara base y las tres posiciones laterales."),
      nextStep: text("Update the complete new orientation before tipping again.", "Aggiorna l'intero nuovo orientamento prima di ribaltare di nuovo.", "Actualiza toda la nueva orientación antes de volver a volcar."),
    }
  }

  if (question.response.kind === "coordinate") {
    const parsed = parseCoordinateAnswer(answer)
    if (!parsed) {
      return {
        kind: "format",
        title: text("Both coordinates are needed.", "Servono entrambe le coordinate.", "Se necesitan las dos coordenadas."),
        message: text("Enter one number for x and one for y. Decimal commas and decimal points work in both fields.", "Inserisci un numero per x e uno per y. In entrambi i campi funzionano sia la virgola sia il punto decimale.", "Introduce un número para x y otro para y. En ambos campos funcionan tanto la coma como el punto decimal."),
        nextStep: text("Read the point as (x | y): horizontal first, then vertical.", "Leggi il punto come (x | y): prima orizzontale, poi verticale.", "Lee el punto como (x | y): primero horizontal y después vertical."),
      }
    }
    if (parsed.x === question.response.y && parsed.y === question.response.x) {
      return localizeAnswerDiagnosis({
        kind: "coordinate-order",
        title: "",
        message: "",
        nextStep: "",
      }, question, locale)
    }
  }

  return conceptDiagnosis(question, locale)
}
