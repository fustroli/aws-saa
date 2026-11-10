import type { CSSProperties } from 'react'
import type { SessionResult } from './Session'
import { accuracyLevel } from '../lib/quiz'

interface Props {
  results: SessionResult[]
  onAgain: () => void
  onHome: () => void
}

const answerText = (r: SessionResult, ids: string[]) =>
  r.question.options
    .filter((o) => ids.includes(o.id))
    .map((o) => o.text)
    .join(' + ')

export function Summary({ results, onAgain, onHome }: Props) {
  const correct = results.filter((r) => r.correct).length
  const pct = results.length === 0 ? 0 : Math.round((correct / results.length) * 100)
  const band = accuracyLevel(pct)
  const message = band === 'good' ? 'Great job — above the passing mark!' : band === 'mid' ? 'Getting there, keep going.' : 'Keep practicing — review the misses below.'

  return (
    <>
      <section className="card center">
        <div className={`ring ${band}`} style={{ '--pct': pct } as CSSProperties}>
          <span>{pct}%</span>
        </div>
        <p className="score">
          {correct} of {results.length} correct
        </p>
        <p className="muted">{message}</p>
        <div className="actions centered">
          <button className="primary" onClick={onAgain}>
            New session
          </button>
          <button onClick={onHome}>Back to home</button>
        </div>
      </section>

      <section className="card">
        <h2>Question recap</h2>
        <ol className="recap">
          {results.map((r, i) => (
            <li key={r.question.id} className={r.correct ? 'ok' : 'bad'}>
              <span className="mark">{r.correct ? '✓' : '✗'}</span>
              <div>
                <p>
                  <span className="muted">{i + 1}.</span> {r.question.text}
                </p>
                {!r.correct && (
                  <div className="recap-answers">
                    <span className="bad-text">Your answer: {answerText(r, r.selected)}</span>
                    <span className="ok-text">Correct: {answerText(r, r.question.correct)}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
