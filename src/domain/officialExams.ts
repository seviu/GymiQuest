import type {
  MockExamResult,
  MockSubmissionReason,
} from "./model"
import type { ActiveMockExam } from "./mockExam"
import type { OfficialExamBlueprint } from "./officialExam"
import {
  completeOfficialExam2015Review,
  createActiveOfficialExam2015,
  gradeOfficialExam2015,
  officialExam2015Blueprint,
} from "./officialExam2015"
import {
  completeOfficialExam2023Review,
  createActiveOfficialExam2023,
  gradeOfficialExam2023,
  officialExam2023Blueprint,
} from "./officialExam2023"
import {
  completeOfficialExam2024Review,
  createActiveOfficialExam2024,
  gradeOfficialExam2024,
  officialExam2024Blueprint,
} from "./officialExam2024"
import {
  completeOfficialExam2025Review,
  createActiveOfficialExam2025,
  gradeOfficialExam2025,
  officialExam2025Blueprint,
} from "./officialExam2025"
import type { OfficialArchiveEditionId } from "./officialArchiveCatalog"

export interface OfficialExamDefinition {
  blueprint: OfficialExamBlueprint
  create: (seed: string, now?: Date, durationSeconds?: number) => ActiveMockExam
  grade: (
    exam: ActiveMockExam,
    submissionReason: MockSubmissionReason,
    submittedAt?: Date,
  ) => MockExamResult
  completeReview: (
    result: MockExamResult,
    taskScores: readonly number[],
    completedAt?: Date,
  ) => MockExamResult
}

export const officialExamDefinitions: Partial<Record<OfficialArchiveEditionId, OfficialExamDefinition>> = {
  [officialExam2015Blueprint.editionId]: {
    blueprint: officialExam2015Blueprint,
    create: createActiveOfficialExam2015,
    grade: gradeOfficialExam2015,
    completeReview: completeOfficialExam2015Review,
  },
  [officialExam2023Blueprint.editionId]: {
    blueprint: officialExam2023Blueprint,
    create: createActiveOfficialExam2023,
    grade: gradeOfficialExam2023,
    completeReview: completeOfficialExam2023Review,
  },
  [officialExam2024Blueprint.editionId]: {
    blueprint: officialExam2024Blueprint,
    create: createActiveOfficialExam2024,
    grade: gradeOfficialExam2024,
    completeReview: completeOfficialExam2024Review,
  },
  [officialExam2025Blueprint.editionId]: {
    blueprint: officialExam2025Blueprint,
    create: createActiveOfficialExam2025,
    grade: gradeOfficialExam2025,
    completeReview: completeOfficialExam2025Review,
  },
}

export function officialExamDefinition(
  editionId: string | undefined,
): OfficialExamDefinition | undefined {
  return editionId ? officialExamDefinitions[editionId as OfficialArchiveEditionId] : undefined
}

export function resolveOfficialExamBlueprint(
  exam: ActiveMockExam,
): OfficialExamBlueprint | undefined {
  if (exam.source !== "official-archive") return undefined
  return officialExamDefinition(exam.editionId)?.blueprint
}

export function createActiveOfficialExamForEdition(
  editionId: OfficialArchiveEditionId,
  seed: string,
  now = new Date(),
): ActiveMockExam {
  const definition = officialExamDefinition(editionId)
  if (!definition) throw new Error(`The official edition ${editionId} is not encoded for replay.`)
  return definition.create(seed, now)
}

export function gradeSupportedOfficialExam(
  exam: ActiveMockExam,
  submissionReason: MockSubmissionReason,
  submittedAt = new Date(),
): MockExamResult {
  const definition = officialExamDefinition(exam.editionId)
  if (!definition || exam.source !== "official-archive") {
    throw new Error("This official exam edition is not supported.")
  }
  return definition.grade(exam, submissionReason, submittedAt)
}

export function completeSupportedOfficialExamReview(
  result: MockExamResult,
  taskScores: readonly number[],
  completedAt = new Date(),
): MockExamResult {
  const definition = officialExamDefinition(result.editionId)
  if (!definition || result.source !== "official-archive") {
    throw new Error("This official exam edition is not supported.")
  }
  return definition.completeReview(result, taskScores, completedAt)
}
