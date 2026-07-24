import { buildConceptRepairQuestions } from "./conceptRepair"
import { generateQuestion } from "./generators"
import type { GeneratedQuestion, LearningLocale, TopicId } from "./model"

export interface ConceptLabRound {
  reference: GeneratedQuestion
  example: GeneratedQuestion
  check: GeneratedQuestion
}

/**
 * Builds one reproducible concept-lab round. The unshown reference prompt gives
 * the existing concept-repair builder another prompt to avoid when the topic's
 * band has a distinct candidate. The two learner-visible prompts are always
 * kept separate by the concept-repair builder.
 */
export function buildConceptLabRound(
  topicId: TopicId,
  seed: string,
  locale: LearningLocale = "de",
): ConceptLabRound {
  const reference = generateQuestion(
    topicId,
    `${seed}:reference`,
    `${seed}:reference`,
    { version: 6, difficultyBand: "standard" },
    locale,
  )
  const { example, check } = buildConceptRepairQuestions(
    topicId,
    `${seed}:round`,
    reference.prompt,
    6,
    locale,
    reference.provenance,
  )

  return { reference, example, check }
}
