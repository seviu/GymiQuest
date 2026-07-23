import { difficultyBandForTaskQuestion, questionDifficultyScore } from "./difficulty"
import { requireTaskCurriculumPackage } from "./curriculumPackage"
import type {
  DifficultyBand,
  GeneratedQuestion,
  GenerationVersion,
  LearningLocale,
  LearningTask,
  QuestionGenerationRequest,
  TopicId,
} from "./model"
import {
  generateArchiveExpansionQuestion,
  supportsArchiveExpansionTopic,
} from "./archiveGeneratorExpansion"
import { generateArchiveQuestion } from "./archiveGenerators"
import { createRandom, pick, pickIndex } from "./random"
import { generateZap2025Question } from "./zap2025Generators"

const round = (value: number, decimals = 3): number => {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const formatNumber = (value: number, locale: LearningLocale = "de"): string =>
  new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "it" ? "it-CH" : locale === "es" ? "es-ES" : "de-CH", { maximumFractionDigits: 3 }).format(value)

const localText = (
  locale: LearningLocale,
  german: string,
  english: string,
  italian: string,
  spanish: string,
): string => locale === "en" ? english : locale === "it" ? italian : locale === "es" ? spanish : german

const division = (locale: LearningLocale): string => locale === "de" ? ":" : "÷"

const decimalPlaces = (value: number): number =>
  [0, 1, 2, 3].find((decimals) => round(value, decimals) === round(value, 3)) ?? 3

function generateMassConversion(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const direction = random() > 0.5 ? "to-grams" : "to-kilograms"

  if (direction === "to-grams") {
    const kilograms = pick(random, [1.25, 1.5, 2.4, 3.75, 4.2, 6.5, 8.25])
    return {
      id,
      topicId: "mass-units",
      prompt: localText(locale, `Wie viele Gramm sind ${formatNumber(kilograms)} kg?`, `How many grams are ${formatNumber(kilograms, locale)} kg?`, `Quanti grammi sono ${formatNumber(kilograms, locale)} kg?`, `¿Cuántos gramos son ${formatNumber(kilograms, locale)} kg?`),
      answerLabel: localText(locale, "Deine Antwort", "Your answer", "La tua risposta", "Tu respuesta"),
      response: { kind: "number", value: kilograms * 1000, unit: "g", decimals: 0 },
      hint: localText(locale, "Von Kilogramm zu Gramm wird die Zahl 1000-mal so gross.", "From kilograms to grams, the number becomes 1,000 times as large.", "Passando dai chilogrammi ai grammi, il numero diventa 1'000 volte più grande.", "Al pasar de kilogramos a gramos, el número se hace 1000 veces mayor."),
      easierExplanation: localText(locale, `1 kg sind 1000 g. Rechne deshalb ${formatNumber(kilograms)} · 1000.`, `1 kg is 1,000 g. So calculate ${formatNumber(kilograms, locale)} · 1,000.`, `1 kg equivale a 1'000 g. Calcola quindi ${formatNumber(kilograms, locale)} · 1'000.`, `1 kg son 1000 g. Por tanto, calcula ${formatNumber(kilograms, locale)} · 1000.`),
      explanation: `${formatNumber(kilograms, locale)} kg · ${formatNumber(1000, locale)} = ${formatNumber(kilograms * 1000, locale)} g.`,
      workedSteps: [`${formatNumber(kilograms, locale)} · ${formatNumber(1000, locale)}`, `= ${formatNumber(kilograms * 1000, locale)} g`],
      visual: {
        kind: "mass-conversion",
        fromValue: kilograms,
        toValue: kilograms * 1000,
        unit: "kg → g",
      },
    }
  }

  const grams = pick(random, [1250, 1750, 2400, 3250, 4500, 6750, 8200])
  return {
    id,
    topicId: "mass-units",
    prompt: localText(locale, `Wie viele Kilogramm sind ${formatNumber(grams)} g?`, `How many kilograms are ${formatNumber(grams, locale)} g?`, `Quanti chilogrammi sono ${formatNumber(grams, locale)} g?`, `¿Cuántos kilogramos son ${formatNumber(grams, locale)} g?`),
    answerLabel: localText(locale, "Deine Antwort", "Your answer", "La tua risposta", "Tu respuesta"),
    response: { kind: "number", value: grams / 1000, unit: "kg", decimals: 3 },
    hint: localText(locale, "Von Gramm zu Kilogramm wird die Zahl 1000-mal kleiner.", "From grams to kilograms, the number becomes 1,000 times smaller.", "Passando dai grammi ai chilogrammi, il numero diventa 1'000 volte più piccolo.", "Al pasar de gramos a kilogramos, el número se hace 1000 veces menor."),
    easierExplanation: localText(locale, `1000 g sind 1 kg. Rechne deshalb ${formatNumber(grams)} : 1000.`, `1,000 g is 1 kg. So calculate ${formatNumber(grams, locale)} ÷ 1,000.`, `1'000 g equivalgono a 1 kg. Calcola quindi ${formatNumber(grams, locale)} ÷ 1'000.`, `1000 g son 1 kg. Por tanto, calcula ${formatNumber(grams, locale)} ÷ 1000.`),
    explanation: `${formatNumber(grams, locale)} g ${division(locale)} ${formatNumber(1000, locale)} = ${formatNumber(grams / 1000, locale)} kg.`,
    workedSteps: [`${formatNumber(grams, locale)} ${division(locale)} ${formatNumber(1000, locale)}`, `= ${formatNumber(grams / 1000, locale)} kg`],
    visual: {
      kind: "mass-conversion",
      fromValue: grams,
      toValue: grams / 1000,
      unit: "g → kg",
    },
  }
}

function generateFractionOfQuantity(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const denominator = pick(random, [3, 4, 5, 6, 8])
  const numerator = pick(
    random,
    Array.from({ length: denominator - 1 }, (_, index) => index + 1),
  )
  const onePart = pick(random, [4, 6, 8, 9, 12, 15])
  const whole = denominator * onePart
  const answer = numerator * onePart

  return {
    id,
    topicId: "fraction-of-quantity",
    prompt: localText(locale, `Berechne ${numerator}/${denominator} von ${whole} kg.`, `Calculate ${numerator}/${denominator} of ${whole} kg.`, `Calcola ${numerator}/${denominator} di ${whole} kg.`, `Calcula ${numerator}/${denominator} de ${whole} kg.`),
    answerLabel: localText(locale, "Der Bruchteil beträgt", "The fraction is", "La frazione vale", "La fracción es"),
    response: { kind: "number", value: answer, unit: "kg", decimals: 0 },
    hint: localText(locale, `Teile ${whole} zuerst durch den Nenner ${denominator}.`, `First divide ${whole} by the denominator ${denominator}.`, `Dividi prima ${whole} per il denominatore ${denominator}.`, `Divide primero ${whole} entre el denominador ${denominator}.`),
    easierExplanation: localText(locale, `Ein Teil ist ${whole} : ${denominator} = ${onePart}. Du brauchst ${numerator} solche Teile.`, `One part is ${whole} ÷ ${denominator} = ${onePart}. You need ${numerator} of those parts.`, `Una parte è ${whole} ÷ ${denominator} = ${onePart}. Ti servono ${numerator} di queste parti.`, `Una parte es ${whole} ÷ ${denominator} = ${onePart}. Necesitas ${numerator} partes como esa.`),
    explanation: `${whole} ${division(locale)} ${denominator} = ${onePart}; ${onePart} · ${numerator} = ${answer}.`,
    workedSteps: [`${whole} ${division(locale)} ${denominator} = ${onePart}`, `${onePart} · ${numerator} = ${answer} kg`],
    visual: { kind: "fraction-bar", numerator, denominator, toValue: whole, unit: "kg" },
  }
}

function generateReverseFraction(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const denominator = pick(random, [3, 4, 5, 6, 8])
  const numerator = pick(
    random,
    Array.from({ length: denominator - 1 }, (_, index) => index + 1),
  )
  const onePart = pick(random, [3, 4, 5, 6, 8, 10, 12])
  const knownPart = numerator * onePart
  const whole = denominator * onePart
  const knownPartsCopy = locale === "en"
    ? numerator === 1
      ? `One part weighs ${knownPart} kg.`
      : `${numerator} parts weigh ${knownPart} kg altogether.`
    : locale === "it"
      ? numerator === 1
        ? `Una parte pesa ${knownPart} kg.`
        : `${numerator} parti pesano complessivamente ${knownPart} kg.`
      : locale === "es"
        ? numerator === 1
          ? `Una parte pesa ${knownPart} kg.`
          : `${numerator} partes pesan en total ${knownPart} kg.`
      : numerator === 1
        ? `Ein Teil wiegt ${knownPart} kg.`
        : `${numerator} Teile wiegen zusammen ${knownPart} kg.`

  return {
    id,
    topicId: "reverse-fractions",
    prompt: localText(locale, `Nach einer Verarbeitung sind noch ${numerator}/${denominator} der ursprünglichen Masse übrig. Das sind ${knownPart} kg. Wie gross war die Masse vorher?`, `After processing, ${numerator}/${denominator} of the original mass remains. That is ${knownPart} kg. What was the mass before processing?`, `Dopo una lavorazione rimangono ${numerator}/${denominator} della massa iniziale, cioè ${knownPart} kg. Qual era la massa prima della lavorazione?`, `Después de un proceso queda ${numerator}/${denominator} de la masa original, es decir, ${knownPart} kg. ¿Cuál era la masa antes del proceso?`),
    answerLabel: localText(locale, "Die ursprüngliche Masse war", "The original mass was", "La massa iniziale era", "La masa original era"),
    response: { kind: "number", value: whole, unit: "kg", decimals: 0 },
    hint: localText(locale, `Die ${knownPart} kg entsprechen ${numerator} gleich grossen Teilen. Finde zuerst einen Teil.`, `The ${knownPart} kg represents ${numerator} equal parts. Find one part first.`, `I ${knownPart} kg corrispondono a ${numerator} parti uguali. Trova prima una parte.`, `Los ${knownPart} kg corresponden a ${numerator} partes iguales. Halla primero una parte.`),
    easierExplanation: localText(locale, `${knownPartsCopy} Ein Teil wiegt ${knownPart} : ${numerator} = ${onePart} kg. Insgesamt gab es ${denominator} Teile.`, `${knownPartsCopy} One part weighs ${knownPart} ÷ ${numerator} = ${onePart} kg. There were ${denominator} parts altogether.`, `${knownPartsCopy} Una parte pesa ${knownPart} ÷ ${numerator} = ${onePart} kg. In tutto c'erano ${denominator} parti.`, `${knownPartsCopy} Una parte pesa ${knownPart} ÷ ${numerator} = ${onePart} kg. En total había ${denominator} partes.`),
    explanation: `${knownPart} ${division(locale)} ${numerator} = ${onePart}; ${onePart} · ${denominator} = ${whole} kg.`,
    workedSteps: [
      `${knownPart} kg ${division(locale)} ${numerator} = ${onePart} kg ${localText(locale, "pro Teil", "per part", "per parte", "por parte")}`,
      `${onePart} kg · ${denominator} = ${whole} kg`,
      localText(locale, `Kontrolle: ${numerator}/${denominator} von ${whole} kg sind ${knownPart} kg.`, `Check: ${numerator}/${denominator} of ${whole} kg is ${knownPart} kg.`, `Controllo: ${numerator}/${denominator} di ${whole} kg è ${knownPart} kg.`, `Comprobación: ${numerator}/${denominator} de ${whole} kg son ${knownPart} kg.`),
    ],
    visual: { kind: "fraction-bar", numerator, denominator, fromValue: knownPart, toValue: whole, unit: "kg" },
  }
}

interface ReverseChainCandidate {
  kitchenMass: number
  rejectedEvery: number
  retainedNumerator: number
  retainedDenominator: number
  jarGrams: number
  jarCount: number
  transportLoss: number
  usableMass: number
  cookedMass: number
  harvestedMass: number
}

function reverseChainCandidates(): ReverseChainCandidate[] {
  const results: ReverseChainCandidate[] = []
  const kitchenMasses = [48, 60, 72, 84, 90, 96, 108, 120]
  const rejectedEveryValues = [5, 6, 7, 8]
  const retainedFractions = [
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const
  const jarWeights = [250, 500]
  const losses = [1.5, 2, 2.5, 3]

  for (const kitchenMass of kitchenMasses) {
    for (const rejectedEvery of rejectedEveryValues) {
      const usableMass = kitchenMass * ((rejectedEvery - 1) / rejectedEvery)
      if (!Number.isInteger(usableMass)) continue

      for (const [retainedNumerator, retainedDenominator] of retainedFractions) {
        const cookedMass = usableMass * (retainedNumerator / retainedDenominator)
        if (!Number.isInteger(cookedMass)) continue

        for (const jarGrams of jarWeights) {
          const jarCount = (cookedMass * 1000) / jarGrams
          if (!Number.isInteger(jarCount) || jarCount < 24 || jarCount > 480) continue

          for (const transportLoss of losses) {
            results.push({
              kitchenMass,
              rejectedEvery,
              retainedNumerator,
              retainedDenominator,
              jarGrams,
              jarCount,
              transportLoss,
              usableMass,
              cookedMass,
              harvestedMass: kitchenMass + transportLoss,
            })
          }
        }
      }
    }
  }

  return results
}

const chainCandidates = reverseChainCandidates()

function generateReverseChain(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = chainCandidates[pickIndex(random, chainCandidates.length)]!
  const {
    kitchenMass,
    rejectedEvery,
    retainedNumerator,
    retainedDenominator,
    jarGrams,
    jarCount,
    transportLoss,
    usableMass,
    cookedMass,
    harvestedMass,
  } = candidate

  return {
    id,
    topicId: "reverse-chains",
    prompt: localText(locale, `Eine Bäuerin verarbeitet ihre Ernte. Beim Transport gehen ${formatNumber(transportLoss)} kg verloren. In der Küche muss jede ${rejectedEvery}. Frucht aussortiert werden. Nach dem Einkochen bleiben ${retainedNumerator}/${retainedDenominator} der Masse übrig. Damit füllt sie ${jarCount} Gläser zu je ${jarGrams} g.\n\nWie viele Kilogramm hat sie ursprünglich geerntet?`, `A farmer processes her harvest. ${formatNumber(transportLoss, locale)} kg is lost during transport. In the kitchen, every ${rejectedEvery}${rejectedEvery === 3 ? "rd" : "th"} fruit must be discarded. After cooking, ${retainedNumerator}/${retainedDenominator} of the mass remains. She fills ${jarCount} jars of ${jarGrams} g each.\n\nHow many kilograms did she harvest originally?`, `Una contadina lavora il suo raccolto. Durante il trasporto si perdono ${formatNumber(transportLoss, locale)} kg. In cucina deve scartare un frutto ogni ${rejectedEvery}. Dopo la cottura rimangono ${retainedNumerator}/${retainedDenominator} della massa. Con questa quantità riempie ${jarCount} vasetti da ${jarGrams} g ciascuno.\n\nQuanti chilogrammi aveva raccolto all'inizio?`, `Una agricultora procesa su cosecha. Durante el transporte se pierden ${formatNumber(transportLoss, locale)} kg. En la cocina debe desechar una de cada ${rejectedEvery} frutas. Después de la cocción queda ${retainedNumerator}/${retainedDenominator} de la masa. Con ella llena ${jarCount} tarros de ${jarGrams} g cada uno.\n\n¿Cuántos kilogramos había cosechado al principio?`),
    answerLabel: localText(locale, "Ursprünglich geerntet", "Original harvest", "Raccolto iniziale", "Cosecha original"),
    response: { kind: "number", value: harvestedMass, unit: "kg", decimals: 1 },
    hint: localText(locale, "Beginne mit dem Inhalt aller Gläser. Löse danach jede Veränderung in umgekehrter Reihenfolge.", "Start with the contents of all the jars. Then undo each change in reverse order.", "Parti dal contenuto di tutti i vasetti. Poi annulla ogni cambiamento in ordine inverso.", "Empieza por el contenido de todos los tarros. Después deshaz cada cambio en orden inverso."),
    easierExplanation: localText(locale, `Die ${jarCount} Gläser enthalten zusammen ${formatNumber(cookedMass)} kg. Von dort gehst du Schritt für Schritt rückwärts.`, `The ${jarCount} jars contain ${formatNumber(cookedMass, locale)} kg altogether. Work backwards from there, one step at a time.`, `I ${jarCount} vasetti contengono complessivamente ${formatNumber(cookedMass, locale)} kg. Da qui procedi a ritroso, un passaggio alla volta.`, `Los ${jarCount} tarros contienen en total ${formatNumber(cookedMass, locale)} kg. Trabaja hacia atrás desde ahí, paso a paso.`),
    explanation: localText(locale, `Gläser: ${formatNumber(cookedMass)} kg. Vor dem Einkochen: ${formatNumber(usableMass)} kg. Vor dem Aussortieren: ${formatNumber(kitchenMass)} kg. Vor dem Transport: ${formatNumber(harvestedMass)} kg.`, `Jars: ${formatNumber(cookedMass, locale)} kg. Before cooking: ${formatNumber(usableMass, locale)} kg. Before sorting: ${formatNumber(kitchenMass, locale)} kg. Before transport: ${formatNumber(harvestedMass, locale)} kg.`, `Vasetti: ${formatNumber(cookedMass, locale)} kg. Prima della cottura: ${formatNumber(usableMass, locale)} kg. Prima dello scarto: ${formatNumber(kitchenMass, locale)} kg. Prima del trasporto: ${formatNumber(harvestedMass, locale)} kg.`, `Tarros: ${formatNumber(cookedMass, locale)} kg. Antes de cocinar: ${formatNumber(usableMass, locale)} kg. Antes de desechar: ${formatNumber(kitchenMass, locale)} kg. Antes del transporte: ${formatNumber(harvestedMass, locale)} kg.`),
    workedSteps: [
      `${jarCount} · ${jarGrams} g = ${formatNumber(cookedMass, locale)} kg`,
      `${formatNumber(cookedMass, locale)} ${division(locale)} ${retainedNumerator} · ${retainedDenominator} = ${formatNumber(usableMass, locale)} kg`,
      `${formatNumber(usableMass, locale)} ${division(locale)} ${rejectedEvery - 1} · ${rejectedEvery} = ${formatNumber(kitchenMass, locale)} kg`,
      `${formatNumber(kitchenMass, locale)} + ${formatNumber(transportLoss, locale)} = ${formatNumber(harvestedMass, locale)} kg`,
    ],
    practiceSteps: [
      {
        id: "jars",
        label: localText(locale, "Inhalt aller Gläser", "Contents of all jars", "Contenuto di tutti i vasetti", "Contenido de todos los tarros"),
        instruction: localText(locale, `${jarCount} Gläser zu je ${jarGrams} g, als Kilogramm`, `${jarCount} jars of ${jarGrams} g each, in kilograms`, `${jarCount} vasetti da ${jarGrams} g ciascuno, in chilogrammi`, `${jarCount} tarros de ${jarGrams} g cada uno, en kilogramos`),
        value: cookedMass,
        decimals: decimalPlaces(cookedMass),
        unit: "kg",
        nextStep: localText(locale, `Multipliziere ${jarCount} mit ${jarGrams} g und teile das Ergebnis durch 1000.`, `Multiply ${jarCount} by ${jarGrams} g and divide the result by 1,000.`, `Moltiplica ${jarCount} per ${jarGrams} g e dividi il risultato per 1'000.`, `Multiplica ${jarCount} por ${jarGrams} g y divide el resultado entre 1000.`),
      },
      {
        id: "before-cooking",
        label: localText(locale, "Masse vor dem Einkochen", "Mass before cooking", "Massa prima della cottura", "Masa antes de cocinar"),
        instruction: localText(locale, `Nach dem Einkochen bleiben ${retainedNumerator}/${retainedDenominator} übrig`, `${retainedNumerator}/${retainedDenominator} remains after cooking`, `Dopo la cottura rimangono ${retainedNumerator}/${retainedDenominator}`, `Después de cocinar queda ${retainedNumerator}/${retainedDenominator}`),
        value: usableMass,
        decimals: decimalPlaces(usableMass),
        unit: "kg",
        nextStep: localText(locale, `Gehe vom Anteil zurück: Teile durch ${retainedNumerator} und multipliziere mit ${retainedDenominator}.`, `Work back from the fraction: divide by ${retainedNumerator} and multiply by ${retainedDenominator}.`, `Risalendo dalla frazione, dividi per ${retainedNumerator} e moltiplica per ${retainedDenominator}.`, `Trabaja hacia atrás desde la fracción: divide entre ${retainedNumerator} y multiplica por ${retainedDenominator}.`),
      },
      {
        id: "before-sorting",
        label: localText(locale, "Masse vor dem Aussortieren", "Mass before sorting", "Massa prima dello scarto", "Masa antes de desechar"),
        instruction: localText(locale, `Jede ${rejectedEvery}. Frucht wird aussortiert`, `Every ${rejectedEvery}${rejectedEvery === 3 ? "rd" : "th"} fruit is discarded`, `Viene scartato un frutto ogni ${rejectedEvery}`, `Se desecha una de cada ${rejectedEvery} frutas`),
        value: kitchenMass,
        decimals: decimalPlaces(kitchenMass),
        unit: "kg",
        nextStep: localText(locale, `Es bleiben ${rejectedEvery - 1}/${rejectedEvery}. Teile deshalb durch ${rejectedEvery - 1} und multipliziere mit ${rejectedEvery}.`, `${rejectedEvery - 1}/${rejectedEvery} remains. Divide by ${rejectedEvery - 1}, then multiply by ${rejectedEvery}.`, `Rimangono ${rejectedEvery - 1}/${rejectedEvery}. Dividi quindi per ${rejectedEvery - 1} e moltiplica per ${rejectedEvery}.`, `Queda ${rejectedEvery - 1}/${rejectedEvery}. Divide entre ${rejectedEvery - 1} y multiplica después por ${rejectedEvery}.`),
      },
      {
        id: "harvest",
        label: localText(locale, "Ursprüngliche Ernte", "Original harvest", "Raccolto iniziale", "Cosecha original"),
        instruction: localText(locale, `${formatNumber(transportLoss)} kg gingen beim Transport verloren`, `${formatNumber(transportLoss, locale)} kg was lost during transport`, `Durante il trasporto si sono persi ${formatNumber(transportLoss, locale)} kg`, `Durante el transporte se perdieron ${formatNumber(transportLoss, locale)} kg`),
        value: harvestedMass,
        decimals: decimalPlaces(harvestedMass),
        unit: "kg",
        nextStep: localText(locale, `Addiere die verlorenen ${formatNumber(transportLoss)} kg wieder zur Masse vor dem Transport.`, `Add the lost ${formatNumber(transportLoss, locale)} kg back to the mass before transport.`, `Aggiungi di nuovo i ${formatNumber(transportLoss, locale)} kg persi alla massa prima del trasporto.`, `Vuelve a sumar los ${formatNumber(transportLoss, locale)} kg perdidos a la masa anterior al transporte.`),
      },
    ],
    visual: {
      kind: "reverse-chain",
      fromValue: cookedMass,
      toValue: harvestedMass,
      unit: "kg",
      labels: locale === "en"
        ? ["jars", "before cooking", "before sorting", "harvest"]
        : locale === "it"
          ? ["vasetti", "prima della cottura", "prima dello scarto", "raccolto"]
          : locale === "es"
            ? ["tarros", "antes de cocinar", "antes de desechar", "cosecha"]
          : ["Gläser", "vor Einkochen", "vor Aussortieren", "Ernte"],
    },
  }
}

function generateLegacyQuestion(
  topicId: TopicId,
  seed: string,
  id: string,
  generationVersion?: GenerationVersion,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  if (
    generationVersion === 5 &&
    supportsArchiveExpansionTopic(topicId) &&
    createRandom(`${seed}:archive-expansion:v5`)() < 0.5
  ) {
    return generateArchiveExpansionQuestion(topicId, seed, id, locale)
  }

  switch (topicId) {
    case "efficient-arithmetic":
    case "speed-distance-time":
    case "data-tables":
    case "coordinate-transformations":
    case "cube-nets":
    case "number-constraints":
    case "composite-areas":
      return generateArchiveQuestion(topicId, seed, id, locale)
    case "mass-units":
      return generateMassConversion(seed, id, locale)
    case "fraction-of-quantity":
      return generateFractionOfQuantity(seed, id, locale)
    case "reverse-fractions":
      return generateReverseFraction(seed, id, locale)
    case "reverse-chains":
      return generateReverseChain(seed, id, locale)
    default:
      return generateZap2025Question(
        topicId,
        seed,
        id,
        generationVersion === 4 || generationVersion === 5
          ? "full-orientation"
          : "legacy-one-roll",
        locale,
      )
  }
}

const ADAPTIVE_CANDIDATE_TARGET = 15
const ADAPTIVE_CANDIDATE_ATTEMPT_LIMIT = 96

interface ScoredQuestion {
  question: GeneratedQuestion
  score: number
  seed: string
}

function compareScoredQuestions(left: ScoredQuestion, right: ScoredQuestion): number {
  if (left.score !== right.score) return left.score - right.score
  if (left.question.prompt < right.question.prompt) return -1
  if (left.question.prompt > right.question.prompt) return 1
  const leftResponse = JSON.stringify(left.question.response)
  const rightResponse = JSON.stringify(right.question.response)
  return leftResponse < rightResponse ? -1 : leftResponse > rightResponse ? 1 : 0
}

function attachGenerationProfile(
  candidate: ScoredQuestion,
  topicId: TopicId,
  id: string,
  version: GenerationVersion,
  difficultyBand: DifficultyBand,
  candidateCount: number,
  locale: LearningLocale,
): GeneratedQuestion {
  const localizedQuestion = locale === "de"
    ? candidate.question
    : generateLegacyQuestion(topicId, candidate.seed, id, version, locale)
  return {
    ...localizedQuestion,
    id,
    generation: {
      version,
      difficultyBand,
      difficultyScore: candidate.score,
      candidateCount,
    },
  }
}

/**
 * Builds all three bands from one deterministic, de-duplicated candidate pool.
 * Every candidate still comes from the independently tested topic generator;
 * this layer only orders valid instances by their mathematical structure.
 */
export function generateDifficultyVariants(
  topicId: TopicId,
  seed: string,
  id = seed,
  version: GenerationVersion = 5,
  locale: LearningLocale = "de",
): Record<DifficultyBand, GeneratedQuestion> {
  const candidates: ScoredQuestion[] = []
  const prompts = new Set<string>()
  const usesFullSpatialOrientation = version === 4 || version === 5
  const hasSpatialBandCoverage = (): boolean => {
    if (topicId !== "spatial-rolling" || !usesFullSpatialOrientation) return true
    const arrowCounts = candidates.map((candidate) => candidate.question.visual?.arrows?.length ?? 0)
    return arrowCounts.some((count) => count === 0) &&
      arrowCounts.some((count) => count === 1) &&
      arrowCounts.some((count) => count > 1)
  }

  for (let attempt = 0; attempt < ADAPTIVE_CANDIDATE_ATTEMPT_LIMIT; attempt += 1) {
    if (candidates.length >= ADAPTIVE_CANDIDATE_TARGET && hasSpatialBandCoverage()) break
    const candidateSeed = `${seed}:adaptive:v2:candidate:${attempt}`
    const question = generateLegacyQuestion(
      topicId,
      candidateSeed,
      id,
      version,
      "de",
    )
    if (prompts.has(question.prompt)) continue
    prompts.add(question.prompt)
    candidates.push({ question, score: questionDifficultyScore(question), seed: candidateSeed })
  }

  if (candidates.length === 0) {
    throw new Error(`No adaptive candidates were generated for ${topicId}.`)
  }

  candidates.sort(compareScoredQuestions)
  let foundation: ScoredQuestion
  let standard: ScoredQuestion
  let exam: ScoredQuestion
  if (usesFullSpatialOrientation && topicId === "spatial-rolling") {
    const byArrowCount = (predicate: (count: number) => boolean): ScoredQuestion[] => (
      candidates.filter((candidate) => predicate(candidate.question.visual?.arrows?.length ?? 0))
    )
    const foundationCandidates = byArrowCount((count) => count === 0)
    const standardCandidates = byArrowCount((count) => count === 1)
    const examCandidates = byArrowCount((count) => count > 1)
    if (foundationCandidates.length === 0 || standardCandidates.length === 0 || examCandidates.length === 0) {
      throw new Error("The full spatial generator did not produce every difficulty form.")
    }
    const random = createRandom(`${seed}:adaptive:v${version}:band-selection`)
    foundation = foundationCandidates[pickIndex(random, foundationCandidates.length)]!
    standard = standardCandidates[pickIndex(random, standardCandidates.length)]!
    exam = examCandidates[pickIndex(random, examCandidates.length)]!
  } else if (version === 2) {
    const lastIndex = candidates.length - 1
    foundation = candidates[0]!
    standard = candidates[Math.floor(lastIndex / 2)]!
    exam = candidates[lastIndex]!
  } else {
    const firstCut = Math.max(1, Math.ceil(candidates.length / 3))
    const secondCut = Math.max(firstCut + 1, Math.ceil(candidates.length * 2 / 3))
    const random = createRandom(`${seed}:adaptive:v${version}:band-selection`)
    const pickBandCandidate = (start: number, end: number): ScoredQuestion => {
      const boundedEnd = Math.min(candidates.length, Math.max(start + 1, end))
      return candidates[start + pickIndex(random, boundedEnd - start)]!
    }
    foundation = pickBandCandidate(0, firstCut)
    standard = pickBandCandidate(firstCut, secondCut)
    exam = pickBandCandidate(secondCut, candidates.length)
    if (foundation.score >= exam.score) {
      exam = candidates.at(-1)!
    }
    if (foundation.score >= exam.score) {
      foundation = candidates[0]!
    }
  }

  return {
    foundation: attachGenerationProfile(foundation, topicId, id, version, "foundation", candidates.length, locale),
    standard: attachGenerationProfile(standard, topicId, id, version, "standard", candidates.length, locale),
    exam: attachGenerationProfile(exam, topicId, id, version, "exam", candidates.length, locale),
  }
}

export function generateQuestion(
  topicId: TopicId,
  seed: string,
  id = seed,
  generation?: QuestionGenerationRequest,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  return generation
    ? generateDifficultyVariants(topicId, seed, id, generation.version, locale)[generation.difficultyBand]
    : generateLegacyQuestion(topicId, seed, id, undefined, locale)
}

export function generateQuestionsForTask(task: LearningTask): GeneratedQuestion[] {
  const curriculumPackage = requireTaskCurriculumPackage(task)
  const curriculumTopicIds = new Set(curriculumPackage.topicIds)
  if (task.topicIds.length === 0) {
    throw new Error(`Task ${task.id} has no curriculum topics.`)
  }
  for (const topicId of task.topicIds) {
    if (!curriculumTopicIds.has(topicId)) {
      throw new Error(
        `Task ${task.id} uses topic ${topicId} outside ${curriculumPackage.courseId}@${curriculumPackage.version}.`,
      )
    }
  }
  const usedPrompts = new Set<string>()
  const locale = task.contentLocale ?? "de"

  return Array.from({ length: task.questionCount }, (_, index) => {
    const topicId = task.topicIds[index % task.topicIds.length]!
    const baseSeed = `${task.seed}:question:${index}`
    const id = `${task.id}:question:${index}`
    const difficultyBand = difficultyBandForTaskQuestion(task, index)
    const generation = difficultyBand && task.generation
      ? { version: task.generation.version, difficultyBand }
      : undefined
    let questionSeed = baseSeed
    let canonicalQuestion = generateQuestion(topicId, questionSeed, id, generation, "de")
    let retry = 0

    // Different seeds can legitimately land on the same template parameters.
    // Keep the task reproducible while avoiding repeated prompts within one
    // learning session whenever the generator has another valid instance.
    while (usedPrompts.has(canonicalQuestion.prompt) && retry < 32) {
      retry += 1
      questionSeed = `${baseSeed}:variant:${retry}`
      canonicalQuestion = generateQuestion(topicId, questionSeed, id, generation, "de")
    }

    usedPrompts.add(canonicalQuestion.prompt)
    return locale === "de"
      ? canonicalQuestion
      : generateQuestion(topicId, questionSeed, id, generation, locale)
  })
}

export function parseNumericAnswer(value: string): number | undefined {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".")
  if (!normalized) return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseFractionAnswer(
  value: string,
): { numerator: number; denominator: number } | undefined {
  const normalized = value.trim().replace(/\s/g, "")
  const match = normalized.match(/^(-?\d+)\/(-?\d+)$/)
  if (!match) return undefined
  const numerator = Number(match[1])
  const denominator = Number(match[2])
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
    return undefined
  }
  return denominator < 0
    ? { numerator: -numerator, denominator: -denominator }
    : { numerator, denominator }
}

export function isZeroDenominatorFractionAnswer(value: string): boolean {
  const normalized = value.trim().replace(/\s/g, "")
  const match = normalized.match(/^-?\d+\/(-?\d+)$/)
  return match !== null && Number(match[1]) === 0
}

export function parseIntegerSetAnswer(value: string): number[] | undefined {
  const normalized = value.trim()
  if (!normalized || !/^[+\-\d\s,;]+$/.test(normalized)) return undefined
  if (/^[,;]/.test(normalized) || /[,;]$/.test(normalized) || /[,;]\s*[,;]/.test(normalized)) {
    return undefined
  }

  const tokens = normalized.split(/[,;\s]+/)
  if (tokens.some((token) => !/^[+\-]?\d+$/.test(token))) return undefined
  const values = tokens.map(Number)
  if (values.some((entry) => !Number.isSafeInteger(entry))) return undefined
  if (new Set(values).size !== values.length) return undefined
  return values.sort((left, right) => left - right)
}

export function parseIntegerSequenceAnswer(value: string): number[] | undefined {
  const normalized = value.trim()
  if (!normalized || !/^[+\-\d\s,;]+$/.test(normalized)) return undefined
  if (/^[,;]/.test(normalized) || /[,;]$/.test(normalized) || /[,;]\s*[,;]/.test(normalized)) {
    return undefined
  }

  const tokens = normalized.split(/[,;\s]+/)
  if (tokens.some((token) => !/^[+\-]?\d+$/.test(token))) return undefined
  const values = tokens.map(Number)
  return values.every(Number.isSafeInteger) ? values : undefined
}

export function parseCoordinateAnswer(
  value: string,
): { x: number; y: number } | undefined {
  const normalized = value.trim().replace(/^\(/, "").replace(/\)$/, "")
  const separator = normalized.includes("|") ? "|" : normalized.includes(";") ? ";" : undefined
  if (!separator) return undefined
  const parts = normalized.split(separator)
  if (parts.length !== 2) return undefined
  const x = parseNumericAnswer(parts[0] ?? "")
  const y = parseNumericAnswer(parts[1] ?? "")
  return x === undefined || y === undefined ? undefined : { x, y }
}

export function isCorrectNumericInput(
  value: string,
  expected: number,
  decimals: number,
): boolean {
  const parsed = parseNumericAnswer(value)
  if (parsed === undefined) return false
  const tolerance = 10 ** -(decimals + 2)
  return Math.abs(round(parsed - expected, decimals + 3)) <= tolerance
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

export function isCorrectAnswer(question: GeneratedQuestion, value: string): boolean {
  switch (question.response.kind) {
    case "number":
      return isCorrectNumericInput(
        value,
        question.response.value,
        question.response.decimals,
      )
    case "fraction": {
      const parsed = parseFractionAnswer(value)
      if (!parsed) return false
      const equivalent =
        parsed.numerator * question.response.denominator ===
        question.response.numerator * parsed.denominator
      if (!equivalent) return false
      return (
        !question.response.requireSimplified ||
        greatestCommonDivisor(parsed.numerator, parsed.denominator) === 1
      )
    }
    case "choice":
      return value === question.response.value
    case "integer-set": {
      const parsed = parseIntegerSetAnswer(value)
      if (!parsed || parsed.length !== question.response.values.length) return false
      const expected = [...question.response.values].sort((left, right) => left - right)
      return parsed.every((entry, index) => entry === expected[index])
    }
    case "integer-sequence": {
      const parsed = parseIntegerSequenceAnswer(value)
      const expected = question.response.values
      return Boolean(
        parsed &&
        parsed.length === expected.length &&
        parsed.every((entry, index) => entry === expected[index])
      )
    }
    case "coordinate": {
      const parsed = parseCoordinateAnswer(value)
      if (!parsed) return false
      return (
        Math.abs(parsed.x - question.response.x) <= 1e-8 &&
        Math.abs(parsed.y - question.response.y) <= 1e-8
      )
    }
  }
}

export function generatorCandidateCount(): number {
  return chainCandidates.length
}
