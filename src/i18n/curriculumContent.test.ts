import { describe, expect, it } from "vitest"
import { lessons, topics } from "../domain/content"
import { topicIds } from "../domain/model"
import {
  lessonForLocale,
  lessonsForLocale,
  topicForLocale,
  topicsForLocale,
} from "./curriculumContent"

describe("localized curriculum content", () => {
  it("retains the exact native German source objects", () => {
    for (const topicId of topicIds) {
      expect(topicForLocale(topicId, "de")).toBe(topics[topicId])
      expect(lessonForLocale(topicId, "de")).toBe(lessons[topicId])
    }
  })

  it("provides complete authored English topic and lesson copy for all 23 topics", () => {
    const englishTopics = topicsForLocale("en")
    const englishLessons = lessonsForLocale("en")

    expect(Object.keys(englishTopics)).toHaveLength(topicIds.length)
    expect(Object.keys(englishLessons)).toHaveLength(topicIds.length)
    for (const topicId of topicIds) {
      const topic = englishTopics[topicId]
      const lesson = englishLessons[topicId]
      expect(topic.id).toBe(topicId)
      expect(topic.title).not.toBe(topics[topicId].title)
      expect(topic.shortTitle.trim()).not.toBe("")
      expect(topic.description.trim()).not.toBe("")
      expect(topic.prerequisites).toEqual(topics[topicId].prerequisites)
      expect(lesson.topicId).toBe(topicId)
      expect(lesson.goal.trim()).not.toBe("")
      expect(lesson.pages).toHaveLength(lessons[topicId].pages.length)
      expect(lesson.pages[0]?.body.trim()).not.toBe("")
      expect(lesson.pages[0]?.steps.length).toBeGreaterThan(0)
      expect(lesson.pages[0]?.takeaway.trim()).not.toBe("")
    }
  })
})
