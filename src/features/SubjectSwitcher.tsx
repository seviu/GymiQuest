import type { SubjectId } from "../domain/subjectIdentity"
import { useLocalization, type AppLocale } from "../i18n/localization"

const switcherCopy: Record<AppLocale, {
  label: string
  math: string
  german: string
}> = {
  de: { label: "Fach wählen", math: "Mathematik", german: "Deutsch" },
  en: { label: "Choose subject", math: "Mathematics", german: "German" },
  it: { label: "Scegli materia", math: "Matematica", german: "Tedesco" },
  es: { label: "Elige asignatura", math: "Matemáticas", german: "Alemán" },
}

export function SubjectSwitcher({
  value,
  onChange,
}: {
  value: SubjectId
  onChange: (subjectId: SubjectId) => void
}) {
  const { locale } = useLocalization()
  const copy = switcherCopy[locale]
  return (
    <div className="subject-switcher">
      <span className="subject-switcher-label">{copy.label}</span>
      <div className="subject-segments" role="group" aria-label={copy.label}>
        {(["math", "german"] as const).map((subjectId) => (
          <button
            key={subjectId}
            type="button"
            aria-pressed={value === subjectId}
            onClick={() => onChange(subjectId)}
          >
            {copy[subjectId]}
          </button>
        ))}
      </div>
      <label className="subject-mobile-select">
        <span>{copy.label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value as SubjectId)}>
          <option value="math">{copy.math}</option>
          <option value="german">{copy.german}</option>
        </select>
      </label>
    </div>
  )
}
