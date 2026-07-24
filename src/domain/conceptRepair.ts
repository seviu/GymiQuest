import {
  archiveExpansionDiagnostics,
  generateArchiveExpansionQuestion,
  supportsArchiveExpansionTopic,
} from "./archiveGeneratorExpansion"
import {
  archiveCoverageDiagnostics,
  generateArchiveCoverageQuestion,
  supportsArchiveCoverageTopic,
} from "./archiveGeneratorCoverage"
import { questionDifficultyScore } from "./difficulty"
import { generateQuestion } from "./generators"
import type {
  DifficultyBand,
  GeneratedQuestion,
  GenerationVersion,
  LearningLocale,
  TopicId,
} from "./model"

export interface ConceptRepairQuestions {
  example: GeneratedQuestion
  check: GeneratedQuestion
}

function generateDistinctQuestion(
  topicId: TopicId,
  baseSeed: string,
  id: string,
  excludedPrompts: Set<string>,
  difficultyBand?: DifficultyBand,
  generationVersion: GenerationVersion = 2,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  let variant = 0
  const generation = difficultyBand
    ? { version: generationVersion, difficultyBand }
    : undefined
  let question = generateQuestion(topicId, baseSeed, id, generation, locale)

  while (excludedPrompts.has(question.prompt) && variant < 64) {
    variant += 1
    question = generateQuestion(topicId, `${baseSeed}:variant:${variant}`, id, generation, locale)
  }

  return question
}

function buildMatchingArchiveRepairQuestions(
  topicId: TopicId,
  seed: string,
  sourcePrompt: string,
  locale: LearningLocale,
  sourceProvenance: NonNullable<GeneratedQuestion["provenance"]>,
  generationVersion: 5 | 6 = 5,
): ConceptRepairQuestions | undefined {
  if (!supportsArchiveExpansionTopic(topicId)) return undefined

  const family = archiveExpansionDiagnostics().families.find(
    (candidate) => candidate.topicId === topicId && candidate.familyId === sourceProvenance.familyId,
  )
  if (!family) return undefined

  const candidates: Array<{ question: GeneratedQuestion; score: number; seed: string }> = []
  const usedPrompts = new Set([sourcePrompt])
  for (let variant = 0; variant < 256 && candidates.length < 64; variant += 1) {
    const candidateSeed = `${seed}:archive-family:candidate:${variant}`
    const question = generateArchiveExpansionQuestion(topicId, candidateSeed, candidateSeed, locale)
    if (
      question.provenance?.templateId !== sourceProvenance.templateId ||
      usedPrompts.has(question.prompt)
    ) continue
    usedPrompts.add(question.prompt)
    candidates.push({ question, score: questionDifficultyScore(question), seed: candidateSeed })
  }

  if (candidates.length < 2) return undefined
  candidates.sort((left, right) => left.score - right.score || left.seed.localeCompare(right.seed))
  const exampleCandidate = candidates[0]!
  const checkCandidate = candidates[Math.max(1, Math.floor(candidates.length / 2))]!
  const candidateCount = family.templates.find(
    (template) => template.templateId === sourceProvenance.templateId,
  )?.candidateCount ?? family.candidateCount
  const profile = (
    candidate: (typeof candidates)[number],
    id: string,
    difficultyBand: DifficultyBand,
  ): GeneratedQuestion => ({
    ...candidate.question,
    id,
    generation: {
      version: generationVersion,
      difficultyBand,
      difficultyScore: candidate.score,
      candidateCount,
    },
  })

  return {
    example: profile(exampleCandidate, `${seed}:example`, "foundation"),
    check: profile(checkCandidate, `${seed}:check`, "standard"),
  }
}

function buildMatchingCoverageRepairQuestions(
  topicId: TopicId,
  seed: string,
  sourcePrompt: string,
  locale: LearningLocale,
  sourceProvenance: NonNullable<GeneratedQuestion["provenance"]>,
): ConceptRepairQuestions | undefined {
  if (!supportsArchiveCoverageTopic(topicId)) return undefined

  const family = archiveCoverageDiagnostics().families.find(
    (candidate) => candidate.topicId === topicId && candidate.familyId === sourceProvenance.familyId,
  )
  if (!family) return undefined

  const candidates: Array<{ question: GeneratedQuestion; score: number; seed: string }> = []
  const usedPrompts = new Set([sourcePrompt])
  for (let variant = 0; variant < 256 && candidates.length < 64; variant += 1) {
    const candidateSeed = `${seed}:archive-coverage-family:candidate:${variant}`
    const question = generateArchiveCoverageQuestion(topicId, candidateSeed, candidateSeed, locale)
    if (
      question.provenance?.templateId !== sourceProvenance.templateId ||
      usedPrompts.has(question.prompt)
    ) continue
    usedPrompts.add(question.prompt)
    candidates.push({ question, score: questionDifficultyScore(question), seed: candidateSeed })
  }

  if (candidates.length < 2) return undefined
  candidates.sort((left, right) => left.score - right.score || left.seed.localeCompare(right.seed))
  const exampleCandidate = candidates[0]!
  const checkCandidate = candidates[Math.max(1, Math.floor(candidates.length / 2))]!
  const candidateCount = family.templates.find(
    (template) => template.templateId === sourceProvenance.templateId,
  )?.candidateCount ?? family.candidateCount
  const profile = (
    candidate: (typeof candidates)[number],
    id: string,
    difficultyBand: DifficultyBand,
  ): GeneratedQuestion => ({
    ...candidate.question,
    id,
    generation: {
      version: 6,
      difficultyBand,
      difficultyScore: candidate.score,
      candidateCount,
    },
  })

  return {
    example: profile(exampleCandidate, `${seed}:example`, "foundation"),
    check: profile(checkCandidate, `${seed}:check`, "standard"),
  }
}

/**
 * Builds a worked example and an unrevealed teach-back check for the same
 * concept. Seeds make the detour reproducible across reloads while the prompt
 * exclusions keep it separate from the learner's original question.
 */
export function buildConceptRepairQuestions(
  topicId: TopicId,
  seed: string,
  sourcePrompt: string,
  version: 1 | GenerationVersion = 1,
  locale: LearningLocale = "de",
  sourceProvenance?: GeneratedQuestion["provenance"],
): ConceptRepairQuestions {
  const matchingCoverageQuestions = version === 6 && sourceProvenance
    ? buildMatchingCoverageRepairQuestions(topicId, seed, sourcePrompt, locale, sourceProvenance)
    : undefined
  if (matchingCoverageQuestions) return matchingCoverageQuestions

  const matchingArchiveQuestions = (version === 5 || version === 6) && sourceProvenance
    ? buildMatchingArchiveRepairQuestions(
        topicId,
        seed,
        sourcePrompt,
        locale,
        sourceProvenance,
        version,
      )
    : undefined
  if (matchingArchiveQuestions) return matchingArchiveQuestions

  const usedPrompts = new Set([sourcePrompt])
  const repairGenerationVersion: GenerationVersion =
    version === 6 && sourceProvenance
      ? 6
      : version === 5 && sourceProvenance
        ? 5
        : version === 4 || version === 5 || version === 6
          ? 4
          : version === 3
            ? 3
            : 2
  const example = generateDistinctQuestion(
    topicId,
    `${seed}:example`,
    `${seed}:example`,
    usedPrompts,
    version >= 2 ? "foundation" : undefined,
    repairGenerationVersion,
    locale,
  )
  usedPrompts.add(example.prompt)

  const check = generateDistinctQuestion(
    topicId,
    `${seed}:check`,
    `${seed}:check`,
    usedPrompts,
    version >= 2 ? "standard" : undefined,
    repairGenerationVersion,
    locale,
  )

  return { example, check }
}
