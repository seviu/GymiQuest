import type {
  DifficultyBand,
  LearnerState,
  LearningTask,
  LessonPacingMode,
  LessonPacingProfile,
  QuestionResult,
  TopicId,
} from "./model"

export const MIN_ACCELERATED_LESSON_PACING_RESULTS = 2

export interface LessonPacingPlan {
  profile: LessonPacingProfile
  difficultyBands: DifficultyBand[]
}

const difficultyOrder: DifficultyBand[] = ["foundation", "standard", "exam"]

export function lessonPacingDifficultyBands(
  mode: LessonPacingMode,
  questionCount: number,
): DifficultyBand[] | undefined {
  if (mode === "accelerated" && questionCount === 2) {
    return ["standard", "exam"]
  }
  if (mode === "steady" && questionCount === 3) {
    return ["foundation", "standard", "exam"]
  }
  if (mode === "supported" && questionCount === 3) {
    return ["foundation", "foundation", "standard"]
  }
  if (mode === "supported" && questionCount === 4) {
    return ["foundation", "foundation", "standard", "exam"]
  }
  return undefined
}

export function isLessonPacingQuestionCount(
  mode: LessonPacingMode,
  questionCount: number,
): boolean {
  return lessonPacingDifficultyBands(mode, questionCount) !== undefined
}

function recentQuestionResults(
  state: Pick<LearnerState, "learningEvents">,
  relevantTopicIds: readonly TopicId[],
): QuestionResult[] {
  const relevant = new Set(relevantTopicIds)
  const events = [...state.learningEvents]
    .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
    .reverse()

  for (const event of events) {
    const results = event.questionResults.filter((result) => relevant.has(result.topicId))
    if (results.length > 0) return results
  }
  return []
}

/**
 * A new learner gets the full three-step ramp. The most recent completed round
 * involving this topic or an immediate prerequisite supplies the pacing
 * evidence, so an unrelated topic cannot make the next lesson shorter.
 */
export function buildLessonPacingPlan(
  state: Pick<LearnerState, "learningEvents" | "preferences">,
  relevantTopicIds: readonly TopicId[],
): LessonPacingPlan {
  const results = recentQuestionResults(state, relevantTopicIds)
  let mode: LessonPacingMode = "steady"

  if (results.length > 0) {
    const independentRate = results.filter((result) => (
      result.independentlySolved &&
      result.attempts === 1 &&
      result.hintsUsed === 0
    )).length / results.length

    if (
      results.length >= MIN_ACCELERATED_LESSON_PACING_RESULTS &&
      independentRate === 1
    ) {
      mode = "accelerated"
    } else if (independentRate <= 0.5) {
      mode = "supported"
    }
  }

  const questionCount = mode === "accelerated"
    ? 2
    : mode === "supported" && state.preferences.sessionMinutes !== 10
      ? 4
      : 3
  const difficultyBands = lessonPacingDifficultyBands(mode, questionCount)!

  return {
    profile: { version: 1, mode },
    difficultyBands,
  }
}

function shiftedDifficulty(
  current: DifficultyBand,
  direction: -1 | 0 | 1,
): DifficultyBand {
  const currentIndex = difficultyOrder.indexOf(current)
  const nextIndex = Math.min(
    difficultyOrder.length - 1,
    Math.max(0, currentIndex + direction),
  )
  return difficultyOrder[nextIndex]!
}

function adaptedDifficultyBands(
  profile: LessonPacingProfile,
  questionCount: number,
  difficultyBands: readonly DifficultyBand[],
  completedResults: readonly QuestionResult[],
): readonly DifficultyBand[] {
  const nextQuestionIndex = completedResults.length
  if (nextQuestionIndex <= 0 || nextQuestionIndex >= questionCount) {
    return difficultyBands
  }

  const latest = completedResults.at(-1)!
  const currentBand = latest.difficultyBand ??
    difficultyBands[nextQuestionIndex - 1]
  if (!currentBand) return difficultyBands

  const independent = latest.independentlySolved &&
    latest.attempts === 1 &&
    latest.hintsUsed === 0
  const direction: -1 | 0 | 1 = independent
    ? 1
    : latest.hintsUsed > 0
      ? 0
      : latest.solved === false
        ? -1
        : 0
  let nextBand = shiftedDifficulty(currentBand, direction)
  const bandOccurrences = (band: DifficultyBand): number => completedResults.filter(
    (result) => result.difficultyBand === band,
  ).length

  // Repeating one level once can help; drilling the same level for the whole
  // round is neither useful pacing nor reliably distinct across every topic.
  if (bandOccurrences(nextBand) >= 2) {
    const plannedBand = lessonPacingDifficultyBands(
      profile.mode,
      questionCount,
    )?.[nextQuestionIndex]
    const currentIndex = difficultyOrder.indexOf(currentBand)
    const plannedIndex = difficultyOrder.indexOf(plannedBand ?? currentBand)
    const nearestAvailableBand = difficultyOrder
      .filter((band) => bandOccurrences(band) < 2)
      .sort((left, right) => (
        Math.abs(difficultyOrder.indexOf(left) - currentIndex) -
          Math.abs(difficultyOrder.indexOf(right) - currentIndex) ||
        Math.abs(difficultyOrder.indexOf(left) - plannedIndex) -
          Math.abs(difficultyOrder.indexOf(right) - plannedIndex)
      ))[0]
    nextBand = bandOccurrences(currentBand) < 2
      ? currentBand
      : nearestAvailableBand ?? nextBand
  }
  if (difficultyBands[nextQuestionIndex] === nextBand) {
    return difficultyBands
  }

  const adapted = [...difficultyBands]
  adapted[nextQuestionIndex] = nextBand
  return adapted
}

/**
 * Only the next unshown question changes. The completed question, task length,
 * seed, and all later scoring evidence remain stable and reloadable.
 */
export function adaptLessonTaskAfterQuestion(
  task: LearningTask,
  completedResults: readonly QuestionResult[],
): LearningTask {
  if (
    task.kind !== "lesson" ||
    task.pacing?.version !== 1 ||
    !task.generation
  ) {
    return task
  }

  const difficultyBands = adaptedDifficultyBands(
    task.pacing,
    task.questionCount,
    task.generation.difficultyBands,
    completedResults,
  )
  if (difficultyBands === task.generation.difficultyBands) return task

  return {
    ...task,
    generation: {
      ...task.generation,
      difficultyBands: [...difficultyBands],
    },
  }
}

function sameDifficultyBands(
  left: readonly DifficultyBand[],
  right: readonly DifficultyBand[],
): boolean {
  return left.length === right.length &&
    left.every((band, index) => band === right[index])
}

/**
 * Replays persisted results from the immutable starting plan. This rejects an
 * imported snapshot whose shown bands or future path could not have been
 * produced by the pacing engine.
 */
export function lessonPacingTaskMatchesResults(
  task: LearningTask,
  completedResults: readonly QuestionResult[],
): boolean {
  if (
    task.kind !== "lesson" ||
    task.pacing?.version !== 1 ||
    !task.generation
  ) {
    return false
  }

  const initialBands = lessonPacingDifficultyBands(
    task.pacing.mode,
    task.questionCount,
  )
  if (!initialBands || completedResults.length > task.questionCount) return false

  let replayedBands: readonly DifficultyBand[] = initialBands
  const replayedResults: QuestionResult[] = []
  for (const [index, result] of completedResults.entries()) {
    if (result.difficultyBand !== replayedBands[index]) return false
    replayedResults.push(result)
    replayedBands = adaptedDifficultyBands(
      task.pacing,
      task.questionCount,
      replayedBands,
      replayedResults,
    )
  }
  return sameDifficultyBands(replayedBands, task.generation.difficultyBands)
}

const pacingEvidenceOutcomes = [
  {
    attempts: 1,
    hintsUsed: 0,
    independentlySolved: true,
    solved: true,
  },
  {
    attempts: 2,
    hintsUsed: 0,
    independentlySolved: false,
    solved: true,
  },
  {
    attempts: 1,
    hintsUsed: 1,
    independentlySolved: false,
    solved: false,
  },
  {
    attempts: 1,
    hintsUsed: 0,
    independentlySolved: false,
    solved: false,
  },
] as const

function syntheticPacingResult(
  index: number,
  difficultyBand: DifficultyBand,
  outcome: (typeof pacingEvidenceOutcomes)[number],
): QuestionResult {
  return {
    questionId: `pacing-validation:${index}`,
    topicId: "mass-units",
    activeSeconds: 1,
    difficultyBand,
    ...outcome,
  }
}

/**
 * Exercise reports do not contain earlier results. Enumerate the small bounded
 * outcome space to prove that their saved path is reachable at this index.
 */
export function isReachableLessonPacingDifficultyBands(
  mode: LessonPacingMode,
  questionCount: number,
  difficultyBands: readonly DifficultyBand[],
  completedQuestionCount: number,
): boolean {
  const initialBands = lessonPacingDifficultyBands(mode, questionCount)
  if (
    !initialBands ||
    !Number.isInteger(completedQuestionCount) ||
    completedQuestionCount < 0 ||
    completedQuestionCount > questionCount
  ) {
    return false
  }

  const profile: LessonPacingProfile = { version: 1, mode }
  let reachable = [initialBands]
  for (let index = 0; index < completedQuestionCount; index += 1) {
    const nextReachable = new Map<string, DifficultyBand[]>()
    for (const bands of reachable) {
      const previousResults = Array.from({ length: index }, (_, previousIndex) => (
        syntheticPacingResult(
          previousIndex,
          bands[previousIndex]!,
          pacingEvidenceOutcomes[1],
        )
      ))
      for (const outcome of pacingEvidenceOutcomes) {
        const results = [
          ...previousResults,
          syntheticPacingResult(index, bands[index]!, outcome),
        ]
        const adapted = [
          ...adaptedDifficultyBands(profile, questionCount, bands, results),
        ]
        nextReachable.set(adapted.join(","), adapted)
      }
    }
    reachable = [...nextReachable.values()]
  }

  return reachable.some((bands) => sameDifficultyBands(bands, difficultyBands))
}
