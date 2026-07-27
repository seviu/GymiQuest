import { describe, expect, it } from "vitest"
import { germanTheoryByTopic } from "./content"
import { germanTopicIds } from "./package"

describe("German topic theory", () => {
  it("has a complete child-friendly explanation for every covered topic", () => {
    expect(Object.keys(germanTheoryByTopic).sort()).toEqual([...germanTopicIds].sort())

    for (const topicId of germanTopicIds) {
      const theory = germanTheoryByTopic[topicId]
      expect(theory.title.trim()).not.toBe("")
      expect(theory.body.trim()).not.toBe("")
      expect(theory.steps.length).toBeGreaterThan(0)
      expect(theory.takeaway.trim()).not.toBe("")
    }
  })
})
