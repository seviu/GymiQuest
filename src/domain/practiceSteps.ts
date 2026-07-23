import type {
  GeneratedQuestion,
  LearningTask,
  PracticeStep,
} from "./model"
import { isCorrectNumericInput, parseNumericAnswer } from "./generators"

export type PracticeStepStatus = "pending" | "correct" | "attention" | "format"

export interface PracticeStepIssue {
  stepId: string
  stepNumber: number
  title: string
  message: string
  nextStep: string
}

export interface PracticeStepGrade {
  correct: boolean
  statuses: Record<string, PracticeStepStatus>
  issue?: PracticeStepIssue
}

export type PracticeStepAnswers = Record<string, string>

export function shouldUsePracticeSteps(
  task: LearningTask,
  question: GeneratedQuestion,
): question is GeneratedQuestion & { practiceSteps: PracticeStep[] } {
  return Boolean(
    question.practiceSteps?.length &&
    (task.kind === "lesson" || task.kind === "repair"),
  )
}

export function decodePracticeStepAnswers(
  serialized: string,
  steps: PracticeStep[],
): PracticeStepAnswers {
  if (!serialized.trim()) return {}

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const record = parsed as Record<string, unknown>
    const answers: PracticeStepAnswers = {}
    for (const step of steps) {
      const value = record[step.id]
      if (typeof value === "string") answers[step.id] = value
    }
    return answers
  } catch {
    // Sessions created before structured work existed may contain a single
    // final answer. Keep it visible in the final step instead of discarding it.
    const finalStep = steps.at(-1)
    return finalStep ? { [finalStep.id]: serialized } : {}
  }
}

export function encodePracticeStepAnswers(answers: PracticeStepAnswers): string {
  return JSON.stringify(answers)
}

export function arePracticeStepsComplete(
  steps: PracticeStep[],
  answers: PracticeStepAnswers,
): boolean {
  return steps.every((step) => answers[step.id]?.trim())
}

export function normalizeVerifiedPracticeSteps(
  steps: PracticeStep[],
  verifiedStepIds: string[],
): string[] {
  const normalized: string[] = []
  for (const [index, stepId] of verifiedStepIds.entries()) {
    if (steps[index]?.id !== stepId) break
    normalized.push(stepId)
  }
  return normalized
}

export function gradePracticeSteps(
  steps: PracticeStep[],
  answers: PracticeStepAnswers,
): PracticeStepGrade {
  const statuses = Object.fromEntries(
    steps.map((step) => [step.id, "pending"]),
  ) as Record<string, PracticeStepStatus>

  for (const [index, step] of steps.entries()) {
    const answer = answers[step.id]?.trim() ?? ""
    if (!answer) {
      statuses[step.id] = "attention"
      return {
        correct: false,
        statuses,
        issue: {
          stepId: step.id,
          stepNumber: index + 1,
          title: `Schritt ${index + 1} ist noch leer.`,
          message: `Trage zuerst „${step.label}“ ein. Spätere Schritte prüfen wir danach.`,
          nextStep: step.nextStep,
        },
      }
    }

    if (parseNumericAnswer(answer) === undefined) {
      statuses[step.id] = "attention"
      return {
        correct: false,
        statuses,
        issue: {
          stepId: step.id,
          stepNumber: index + 1,
          title: `Schritt ${index + 1} braucht eine Zahl.`,
          message: `Schreibe bei „${step.label}“ nur die Zahl. Die Einheit steht bereits neben dem Feld.`,
          nextStep: step.nextStep,
        },
      }
    }

    if (!isCorrectNumericInput(answer, step.value, step.decimals)) {
      statuses[step.id] = "attention"
      return {
        correct: false,
        statuses,
        issue: {
          stepId: step.id,
          stepNumber: index + 1,
          title: `Prüfe Schritt ${index + 1}: ${step.label}.`,
          message: index === 0
            ? "Der erste sichere Zwischenwert stimmt noch nicht."
            : index === 1
              ? "Der erste Schritt stimmt. Hier ist die erste Abweichung."
              : `Die ersten ${index} Schritte stimmen. Hier ist die erste Abweichung.`,
          nextStep: step.nextStep,
        },
      }
    }

    statuses[step.id] = "correct"
  }

  return { correct: true, statuses }
}
