import type { ReactNode } from "react"
import type { TheorySupportCopy } from "../i18n/theorySupportCopy"
import type { TopicTheoryHeadingLevel } from "./TopicTheoryDisclosure"

const topicTheoryHeadingTag = {
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const

export function TopicTheorySupportCard({
  topicId,
  topicTitle,
  guidanceTitle,
  commonHurdle,
  nextStep,
  exampleTitle,
  workedSteps,
  takeaway,
  visual,
  copy,
  className,
  headingLevel = 2,
  onUnderstood,
  onRequestSupport,
}: {
  topicId: string
  topicTitle: string
  guidanceTitle: string
  commonHurdle: string
  nextStep: string
  exampleTitle: string
  workedSteps: readonly string[]
  takeaway: string
  visual?: ReactNode
  copy: TheorySupportCopy
  className?: string
  headingLevel?: TopicTheoryHeadingLevel
  onUnderstood?: () => void
  onRequestSupport?: () => void
}) {
  const Heading = topicTheoryHeadingTag[headingLevel]
  const headingId = `topic-theory-support-${topicId.replace(/[^a-zA-Z0-9_-]/g, "-")}`

  return (
    <section
      className={`topic-theory-support-card${className ? ` ${className}` : ""}`}
      data-topic-theory-support={topicId}
      aria-labelledby={headingId}
    >
      <header>
        <span className="eyebrow">{copy.eyebrow}</span>
        <Heading id={headingId}>{copy.title(topicTitle)}</Heading>
        <p>{copy.intro}</p>
      </header>

      <div className="topic-theory-support-guidance">
        <section className="topic-theory-support-hurdle">
          <span aria-hidden="true">!</span>
          <div>
            <small>{copy.commonHurdleLabel}</small>
            <strong>{guidanceTitle}</strong>
            <p>{commonHurdle}</p>
          </div>
        </section>
        <section className="topic-theory-support-next">
          <small>{copy.nextStepLabel}</small>
          <p>{nextStep}</p>
        </section>
      </div>

      <section className="topic-theory-support-example">
        <div>
          <small>{copy.exampleLabel}</small>
          <strong>{exampleTitle}</strong>
          <ol>
            {workedSteps.map((step, index) => <li key={`${topicId}:support:${index}`}>{step}</li>)}
          </ol>
        </div>
        {visual != null && <div className="topic-theory-support-visual">{visual}</div>}
      </section>

      <div className="topic-theory-support-takeaway">
        <span>{copy.rememberLabel}</span>
        <strong>{takeaway}</strong>
      </div>

      <aside className="topic-theory-support-teach-back">
        <span aria-hidden="true">↗</span>
        <div>
          <strong>{copy.teachBackLabel}</strong>
          <p>{copy.teachBackPrompt}</p>
        </div>
      </aside>

      {(onUnderstood || onRequestSupport) && (
        <div className="topic-theory-support-actions">
          {onUnderstood && (
            <button className="primary-button" type="button" onClick={onUnderstood}>
              {copy.understood}
            </button>
          )}
          {onRequestSupport && (
            <button className="text-button" type="button" onClick={onRequestSupport}>
              {copy.stillNeedSupport}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
