import { DOMAINS } from '../types'
import type { Progress, Question } from '../types'
import { accuracyLevel as level, computeStats, percent, reviewPool, type Accuracy } from '../lib/quiz'
import type { Mode } from './Setup'
import type { ReactNode } from 'react'

interface Props {
  questions: Question[]
  progress: Progress
  /** Clears on all linked devices too when sync is on. */
  synced: boolean
  syncPanel: ReactNode
  onStart: (mode: Mode) => void
  onReset: () => void
}

function Bar({ label, acc }: { label: string; acc: Accuracy }) {
  const pct = percent(acc)
  return (
    <div className="stat-row">
      <div className="stat-label">
        <span>{label}</span>
        <span className="muted">{acc.total === 0 ? '—' : `${pct}% · ${acc.correct}/${acc.total}`}</span>
      </div>
      <div className="bar">
        <div className={`bar-fill ${level(pct)}`} style={{ width: `${acc.total === 0 ? 0 : Math.max(pct, 2)}%` }} />
      </div>
    </div>
  )
}

export function Home({ questions, progress, synced, syncPanel, onStart, onReset }: Props) {
  const stats = computeStats(questions, progress.attempts)
  const reviewCount = reviewPool(questions, progress.attempts, progress.bookmarks, 'both').length
  const overallPct = percent(stats.overall)

  const handleReset = () => {
    const scope = synced ? ' on every device linked to your sync ID' : ''
    if (confirm(`Delete all attempts and bookmarks${scope}? This cannot be undone.`)) onReset()
  }

  return (
    <>
      <section className="tiles">
        <div className="tile">
          <span className="tile-value">
            {stats.attempted}
            <small>/{stats.totalQuestions}</small>
          </span>
          <span className="tile-label">Questions seen</span>
        </div>
        <div className="tile">
          <span className={`tile-value ${stats.overall.total ? level(overallPct) : ''}`}>
            {stats.overall.total ? `${overallPct}%` : '—'}
          </span>
          <span className="tile-label">Accuracy</span>
        </div>
        <div className="tile">
          <span className="tile-value">{reviewCount}</span>
          <span className="tile-label">To review</span>
        </div>
      </section>

      <section className="modes">
        <button className="mode-card" onClick={() => onStart('practice')}>
          <span className="mode-icon" aria-hidden>
            📝
          </span>
          <span className="mode-title">Practice</span>
          <span className="mode-desc">Answer questions with instant feedback and explanations.</span>
        </button>
        <button className="mode-card" onClick={() => onStart('review')} disabled={reviewCount === 0}>
          <span className="mode-icon" aria-hidden>
            🔁
          </span>
          <span className="mode-title">Review</span>
          <span className="mode-desc">
            {reviewCount === 0
              ? 'Unlocks after a wrong answer or a bookmark.'
              : `Revisit ${reviewCount} missed or bookmarked question${reviewCount === 1 ? '' : 's'}.`}
          </span>
        </button>
      </section>

      <section className="card">
        <h2>Progress by domain</h2>
        {DOMAINS.map((d) => (
          <Bar key={d.id} label={`${d.name} · ${d.weight}%`} acc={stats.byDomain[d.id]} />
        ))}
        <p className="muted small-text">The exam passing score is 720/1000 (about 72%).</p>
      </section>

      {syncPanel}

      <footer className="footer">
        <button className="link danger-link" onClick={handleReset}>
          Reset progress
        </button>
      </footer>
    </>
  )
}
