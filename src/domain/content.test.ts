import { describe, expect, it } from "vitest"
import { lessons, orderedTopics, topics } from "./content"
import { generateQuestion } from "./generators"
import { topicIds } from "./model"

describe("2015-2025 curriculum graph", () => {
  it("has one ordered definition, lesson, and generator for every topic", () => {
    expect(Object.keys(topics).sort()).toEqual([...topicIds].sort())
    expect(Object.keys(lessons).sort()).toEqual([...topicIds].sort())
    expect(orderedTopics().map((topic) => topic.courseOrder)).toEqual(
      Array.from({ length: topicIds.length }, (_, index) => index + 1),
    )

    for (const topicId of topicIds) {
      expect(lessons[topicId].topicId).toBe(topicId)
      expect(lessons[topicId].pages.length).toBeGreaterThan(0)
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
