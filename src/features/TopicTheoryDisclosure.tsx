import type { ReactNode } from "react"

export interface TopicTheorySection {
  eyebrow: string
  title: string
  body: string
  steps: readonly string[]
  takeaway: string
  visual?: ReactNode
}

export type TopicTheoryHeadingLevel = 2 | 3 | 4 | 5 | 6

const topicTheoryHeadingTag = {
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const

export function TopicTheoryDisclosure({
  topicId,
  label,
  hint,
  sections,
  takeawayLabel,
  className,
  headingLevel = 3,
  onOpen,
}: {
  topicId: string
  label: string
  hint: string
  sections: readonly TopicTheorySection[]
  takeawayLabel: string
  className?: string
  headingLevel?: TopicTheoryHeadingLevel
  onOpen?: () => void
}) {
  const Heading = topicTheoryHeadingTag[headingLevel]

  return (
    <details
      className={`topic-theory-disclosure${className ? ` ${className}` : ""}`}
      data-topic-theory={topicId}
      onToggle={(event) => {
        if (event.currentTarget.open) onOpen?.()
      }}
    >
      <summary>
        <span aria-hidden="true">?</span>
        <span>
          <strong>{label}</strong>
          <small>{hint}</small>
        </span>
        <b aria-hidden="true">⌄</b>
      </summary>
      <div className="topic-theory-content">
        {sections.map((section, index) => (
          <section key={`${topicId}:${index}`}>
            <span className="eyebrow">{section.eyebrow}</span>
            <Heading className="topic-theory-heading">{section.title}</Heading>
            <p>{section.body}</p>
            {section.visual != null && (
              <div className="topic-theory-visual">{section.visual}</div>
            )}
            <ol>
              {section.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <div className="topic-theory-takeaway">
              <span>{takeawayLabel}</span>
              <strong>{section.takeaway}</strong>
            </div>
          </section>
        ))}
      </div>
    </details>
  )
}
