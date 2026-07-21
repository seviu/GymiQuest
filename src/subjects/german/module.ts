import { courseKeys } from "../../domain/subjectIdentity"
import type { SubjectRuntime } from "../../domain/subjectRegistry"
import { germanLessons, germanTopics } from "./content"
import { generateGermanQuestions, type GermanGeneratedQuestion, type GermanGenerationTask } from "./generators"
import { GERMAN_CURRICULUM_PACKAGE, germanLessonIds, germanTopicIds } from "./package"

export const germanSubjectRuntime: SubjectRuntime<GermanGenerationTask, GermanGeneratedQuestion> = Object.freeze({
  id: "german",
  courseKey: courseKeys.german,
  courseId: GERMAN_CURRICULUM_PACKAGE.courseId,
  courseVersion: GERMAN_CURRICULUM_PACKAGE.version,
  title: GERMAN_CURRICULUM_PACKAGE.title,
  shortTitle: GERMAN_CURRICULUM_PACKAGE.shortTitle,
  generator: Object.freeze({
    id: "zh-zap1-german",
    version: GERMAN_CURRICULUM_PACKAGE.generatorVersion,
    corpusVersion: GERMAN_CURRICULUM_PACKAGE.corpusVersion,
  }),
  topics: Object.freeze(germanTopicIds.map((topicId) => germanTopics[topicId])),
  lessons: Object.freeze(germanLessonIds.map((lessonId) => {
    const lesson = germanLessons[lessonId]
    return {
      id: lesson.id,
      topicId: lesson.topicId,
      title: lesson.title,
      goal: lesson.goal,
    }
  })),
  generateQuestions: generateGermanQuestions,
})
