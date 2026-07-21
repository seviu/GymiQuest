import { topics } from "./content"
import { archiveExpansionFamilyCatalog } from "./archiveGeneratorExpansion"
import {
  ACTIVE_CURRICULUM_PACKAGE,
  curriculumPackageReference,
  type CurriculumPackage,
} from "./curriculumPackage"
import { generateQuestionsForTask } from "./generators"
import { buildParentTopicCoaching } from "./parentCoaching"
import {
  difficultyBandIds,
  type DifficultyBand,
  type GeneratedQuestion,
  type LearningLocale,
  type LearningTask,
  type TopicId,
} from "./model"

export const AUTHOR_VALIDATION_TASK_PREFIX = "author-validation:"
export const AUTHOR_VALIDATION_GENERATION_VERSION = 5

export type AuthorValidationKey = `${TopicId}:${DifficultyBand}`
export type AuthorValidationTemplateKey = `${string}:${string}`

export const authorValidationArchiveTemplates = archiveExpansionFamilyCatalog.flatMap((family) => (
  family.templateIds.map((templateId) => ({
    familyId: family.familyId,
    topicId: family.topicId,
    templateId,
    key: `${family.familyId}:${templateId}` as AuthorValidationTemplateKey,
  }))
))

export function authorValidationTemplateKey(
  familyId: string,
  templateId: string,
): AuthorValidationTemplateKey {
  return `${familyId}:${templateId}`
}

export interface AuthorValidationSelection {
  topicId: TopicId
  difficultyBand: DifficultyBand
}

export interface AuthorValidationSample extends AuthorValidationSelection {
  sequence: number
  task: LearningTask
  question: GeneratedQuestion
  expectedAnswer: string
}

export function isAuthorValidationTask(task: Pick<LearningTask, "id">): boolean {
  return task.id.startsWith(AUTHOR_VALIDATION_TASK_PREFIX)
}

export function authorValidationKey(
  topicId: TopicId,
  difficultyBand: DifficultyBand,
): AuthorValidationKey {
  return `${topicId}:${difficultyBand}`
}

export function authorValidationSelections(
  curriculumPackage: CurriculumPackage = ACTIVE_CURRICULUM_PACKAGE,
): AuthorValidationSelection[] {
  return curriculumPackage.topicIds.flatMap((topicId) => difficultyBandIds.map((difficultyBand) => ({
    topicId,
    difficultyBand,
  })))
}

export function nextUncheckedAuthorValidationSelection(
  current: AuthorValidationSelection,
  checked: ReadonlySet<AuthorValidationKey>,
  curriculumPackage: CurriculumPackage = ACTIVE_CURRICULUM_PACKAGE,
): AuthorValidationSelection {
  const selections = authorValidationSelections(curriculumPackage)
  const currentIndex = selections.findIndex((selection) => (
    selection.topicId === current.topicId &&
    selection.difficultyBand === current.difficultyBand
  ))

  for (let offset = 1; offset <= selections.length; offset += 1) {
    const candidate = selections[(Math.max(0, currentIndex) + offset) % selections.length]!
    if (!checked.has(authorValidationKey(candidate.topicId, candidate.difficultyBand))) {
      return candidate
    }
  }

  return current
}

function formatNumber(value: number, decimals: number, locale: LearningLocale = "de"): string {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "it" ? "it-CH" : locale === "es" ? "es-ES" : "de-CH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
  }).format(value)
}

function formatConstructionAnswer(
  question: GeneratedQuestion,
  locale: LearningLocale,
): string | undefined {
  const construction = question.geometryConstruction
  if (!construction) return undefined

  switch (construction.expectedTool) {
    case "parallel":
      return locale === "en"
        ? `Parallel line north of ${construction.reference.label}, distance ${formatNumber(construction.distanceCentimeters, 0, locale)} cm`
        : locale === "it"
          ? `Retta parallela a nord di ${construction.reference.label}, distanza ${formatNumber(construction.distanceCentimeters, 0, locale)} cm`
          : locale === "es"
            ? `Recta paralela al norte de ${construction.reference.label}, distancia ${formatNumber(construction.distanceCentimeters, 0, locale)} cm`
            : `Parallele nördlich von ${construction.reference.label}, Abstand ${formatNumber(construction.distanceCentimeters, 0)} cm`
    case "circle":
      return locale === "en"
        ? `Circle centred at ${construction.reference.point.label}, radius ${formatNumber(construction.distanceCentimeters, 0, locale)} cm`
        : locale === "it"
          ? `Circonferenza con centro ${construction.reference.point.label}, raggio ${formatNumber(construction.distanceCentimeters, 0, locale)} cm`
          : locale === "es"
            ? `Circunferencia con centro en ${construction.reference.point.label}, radio ${formatNumber(construction.distanceCentimeters, 0, locale)} cm`
            : `Kreis um ${construction.reference.point.label}, Radius ${formatNumber(construction.distanceCentimeters, 0)} cm`
    case "bisector":
      return locale === "en"
        ? `Perpendicular bisector of ${construction.reference.first.label}${construction.reference.second.label}`
        : locale === "it"
          ? `Asse del segmento ${construction.reference.first.label}${construction.reference.second.label}`
          : locale === "es"
            ? `Mediatriz del segmento ${construction.reference.first.label}${construction.reference.second.label}`
            : `Mittelsenkrechte von ${construction.reference.first.label}${construction.reference.second.label}`
  }
}

export function formatAuthorValidationAnswer(
  question: GeneratedQuestion,
  locale: LearningLocale = "de",
): string {
  const construction = formatConstructionAnswer(question, locale)
  if (construction) return construction

  switch (question.response.kind) {
    case "number": {
      const unit = question.response.unit ? ` ${question.response.unit}` : ""
      return `${formatNumber(question.response.value, question.response.decimals, locale)}${unit}`
    }
    case "fraction":
      return `${question.response.numerator}/${question.response.denominator}`
    case "choice": {
      const response = question.response
      const option = response.options.find(({ id }) => id === response.value)
      return option ? option.label : response.value
    }
    case "integer-set":
      return question.response.values.join(", ")
    case "integer-sequence":
      return question.response.values.join(" → ")
    case "coordinate":
      return `(${formatNumber(question.response.x, 0, locale)} | ${formatNumber(question.response.y, 0, locale)})`
  }
}

export function buildAuthorValidationSample(
  topicId: TopicId,
  difficultyBand: DifficultyBand,
  sequence: number,
  curriculumPackage: CurriculumPackage = ACTIVE_CURRICULUM_PACKAGE,
  locale: LearningLocale = "de",
): AuthorValidationSample {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new Error("An author-validation sequence must be a positive safe integer.")
  }
  if (!curriculumPackage.topicIds.includes(topicId)) {
    throw new Error(`Topic ${topicId} does not belong to ${curriculumPackage.courseId}@${curriculumPackage.version}.`)
  }

  const id = `${AUTHOR_VALIDATION_TASK_PREFIX}${topicId}:${difficultyBand}:${sequence}`
  const localizedTopic = locale === "de"
    ? topics[topicId]
    : buildParentTopicCoaching(topicId, locale)
  const task: LearningTask = {
    id,
    kind: "review",
    title: locale === "en"
      ? `Review lab: ${localizedTopic.title}`
      : locale === "it"
        ? `Laboratorio di controllo: ${localizedTopic.title}`
        : locale === "es"
          ? `Laboratorio de revisión: ${localizedTopic.title}`
          : `Prüflabor: ${localizedTopic.title}`,
    description: locale === "en"
      ? "Local author review of a fresh dynamic question; learner data is not changed."
      : locale === "it"
        ? "Controllo locale dell'autore su una nuova domanda dinamica; i dati dello studente non vengono modificati."
        : locale === "es"
          ? "Revisión local de autor de una pregunta dinámica nueva; los datos del estudiante no cambian."
          : "Lokale Autorenprüfung einer frischen dynamischen Aufgabe; verändert keine Lerndaten.",
    topicIds: [topicId],
    prerequisiteIds: [...topics[topicId].prerequisites],
    maxXp: 0,
    questionCount: 1,
    seed: id,
    curriculum: curriculumPackageReference(curriculumPackage),
    generation: {
      version: AUTHOR_VALIDATION_GENERATION_VERSION,
      difficultyBands: [difficultyBand],
    },
    contentLocale: locale,
  }
  const question = generateQuestionsForTask(task)[0]!

  return {
    topicId,
    difficultyBand,
    sequence,
    task,
    question,
    expectedAnswer: formatAuthorValidationAnswer(question, locale),
  }
}
