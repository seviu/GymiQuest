import { mathSubjectRuntime } from "../subjects/math/module"
import { germanSubjectRuntime } from "../subjects/german/module"
import type { CourseKey, SubjectId } from "./subjectIdentity"

export {
  courseKeys,
  isSubjectId,
  subjectIdForCourseKey,
  subjectIds,
} from "./subjectIdentity"
export type { CourseKey, SubjectId } from "./subjectIdentity"

export interface SubjectTopicSummary {
  id: string
  title: string
  shortTitle: string
  description: string
  courseOrder: number
}

export interface SubjectLessonSummary {
  id: string
  topicId: string
  title: string
  goal: string
}

export interface SubjectRuntime<TTask, TQuestion> {
  id: SubjectId
  courseKey: CourseKey
  courseId: string
  courseVersion: number
  title: string
  shortTitle: string
  generator: {
    id: "zh-zap1-math" | "zh-zap1-german"
    version: number
    corpusVersion?: number
  }
  topics: readonly SubjectTopicSummary[]
  lessons: readonly SubjectLessonSummary[]
  generateQuestions: (task: TTask) => readonly TQuestion[]
}

export const subjectRegistry = Object.freeze({
  math: mathSubjectRuntime,
  german: germanSubjectRuntime,
})

export function subjectRuntimeFor<S extends SubjectId>(subjectId: S): typeof subjectRegistry[S] {
  return subjectRegistry[subjectId]
}
