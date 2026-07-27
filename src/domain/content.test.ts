import { describe, expect, it } from "vitest"
import { lessons, orderedTopics, topics } from "./content"
import { generateQuestion } from "./generators"
import { topicIds } from "./model"

describe("2015-2025 curriculum graph", () => {
  it("has one ordered definition, complete theory lesson, and generator for every topic", () => {
    expect(Object.keys(topics).sort()).toEqual([...topicIds].sort())
    expect(Object.keys(lessons).sort()).toEqual([...topicIds].sort())
    expect(orderedTopics().map((topic) => topic.courseOrder)).toEqual(
      Array.from({ length: topicIds.length }, (_, index) => index + 1),
    )

    for (const topicId of topicIds) {
      expect(lessons[topicId].topicId).toBe(topicId)
      expect(lessons[topicId].pages.length).toBeGreaterThan(0)
      expect(lessons[topicId].goal.trim()).not.toBe("")
      for (const page of lessons[topicId].pages) {
        expect(page.title.trim()).not.toBe("")
        expect(page.body.trim()).not.toBe("")
        expect(page.steps.length).toBeGreaterThan(0)
        expect(page.takeaway.trim()).not.toBe("")
      }
      expect(generateQuestion(topicId, `coverage:${topicId}`).topicId).toBe(topicId)
    }
  })

  it("only points to existing prerequisites earlier in the learning path", () => {
    for (const topic of orderedTopics()) {
      for (const prerequisiteId of topic.prerequisites) {
        const prerequisite = topics[prerequisiteId]
        expect(prerequisite).toBeDefined()
        expect(prerequisite.courseOrder).toBeLessThan(topic.courseOrder)
      }
    }
  })

  it("contains the 2025 inventory and the highest-frequency archive gaps", () => {
    const expected = [
      "arithmetic-equations",
      "efficient-arithmetic",
      "time-fractions",
      "speed-distance-time",
      "data-tables",
      "money-calculations",
      "proportional-revenue",
      "integer-combinations",
      "number-constraints",
      "area-fractions",
      "composite-areas",
      "tiling-costs",
      "reverse-chains",
      "inverse-proportion",
      "changing-rates",
      "geometric-loci",
      "coordinate-transformations",
      "cube-nets",
      "spatial-rolling",
      "cuboid-surface",
    ]

    expect(topicIds).toEqual(expect.arrayContaining(expected))
  })
})
