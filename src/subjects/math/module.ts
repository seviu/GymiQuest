import { lessons, topics } from "../../domain/content"
import { ACTIVE_CURRICULUM_PACKAGE } from "../../domain/curriculumPackage"
import { generateQuestionsForTask } from "../../domain/generators"
import type { GeneratedQuestion, LearningTask } from "../../domain/model"
import { courseKeys } from "../../domain/subjectIdentity"
import type { SubjectRuntime } from "../../domain/subjectRegistry"

export const mathSubjectRuntime: SubjectRuntime<LearningTask, GeneratedQuestion> = Object.freeze({
  id: "math",
  courseKey: courseKeys.math,
  courseId: ACTIVE_CURRICULUM_PACKAGE.courseId,
  courseVersion: ACTIVE_CURRICULUM_PACKAGE.version,
  title: ACTIVE_CURRICULUM_PACKAGE.title,
  shortTitle: ACTIVE_CURRICULUM_PACKAGE.shortTitle,
  generator: Object.freeze({
    id: "zh-zap1-math",
    version: 6,
  }),
  topics: Object.freeze(ACTIVE_CURRICULUM_PACKAGE.topicIds.map((topicId) => topics[topicId])),
  lessons: Object.freeze(ACTIVE_CURRICULUM_PACKAGE.topicIds.map((topicId) => {
    const lesson = lessons[topicId]
    return {
      id: lesson.id,
      topicId: lesson.topicId,
      title: lesson.title,
      goal: lesson.goal,
    }
  })),
  generateQuestions: generateQuestionsForTask,
})
