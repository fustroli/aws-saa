import { useState } from 'react'
import { DOMAINS } from '../types'
import type { DomainId, Progress, Question, ReviewSource } from '../types'
import { filterByDomain, reviewPool, selectQuestions, shuffle } from '../lib/quiz'

export type Mode = 'practice' | 'review'

interface Props {
  mode: Mode
  questions: Question[]
  progress: Progress
  onStart: (questions: Question[]) => void
  onCancel: () => void
}

const COUNTS = [5, 10, 20, Infinity]
const SOURCES: { id: ReviewSource; label: string }[] = [
  { id: 'both', label: 'Missed + bookmarked' },
  { id: 'wrong', label: 'Missed' },
  { id: 'bookmarked', label: 'Bookmarked' },
]

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; disabled?: boolean }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="group">
      {options.map((o) => (
        <button
          key={String(o.id)}
          className={value === o.id ? 'active' : ''}
          aria-pressed={value === o.id}
          disabled={o.disabled}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Setup({ mode, questions, progress, onStart, onCancel }: Props) {
  const [domain, setDomain] = useState<DomainId | 'all'>('all')
  const [source, setSource] = useState<ReviewSource>('both')
  const [count, setCount] = useState(10)

  const base =
    mode === 'review' ? reviewPool(questions, progress.attempts, progress.bookmarks, source) : questions
  const pool = filterByDomain(base, domain)
  const sessionSize = Math.min(count, pool.length)

  const start = () => {
    const picked = selectQuestions(pool, progress.attempts, count)
    // Shuffle option order once per session so it stays stable while answering.
    onStart(picked.map((q) => ({ ...q, options: shuffle(q.options) })))
  }

  return (
    <section className="card">
      <button className="link back" onClick={onCancel}>
        ← Back
      </button>
      <h2>{mode === 'practice' ? 'Practice session' : 'Review session'}</h2>

      {mode === 'review' && (
        <div className="field">
          <span className="field-label">Questions to review</span>
          <Segmented options={SOURCES} value={source} onChange={setSource} />
        </div>
      )}

      <div className="field">
        <span className="field-label">Domain</span>
        <div className="chips">
          {[{ id: 'all' as const, name: 'All domains' }, ...DOMAINS].map((d) => {
            const n = filterByDomain(base, d.id).length
            return (
              <button
                key={d.id}
                className={`chip ${domain === d.id ? 'active' : ''}`}
                aria-pressed={domain === d.id}
                onClick={() => setDomain(d.id)}
              >
                {d.name.replace('Design ', '')} <span className="chip-count">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Number of questions</span>
        <Segmented
          options={COUNTS.map((c) => ({ id: c, label: c === Infinity ? `All (${pool.length})` : String(c) }))}
          value={count}
          onChange={setCount}
        />
      </div>

      <button className="primary large" onClick={start} disabled={pool.length === 0}>
        {pool.length === 0 ? 'No questions match' : `Start ${sessionSize} question${sessionSize === 1 ? '' : 's'}`}
      </button>
    </section>
  )
}
