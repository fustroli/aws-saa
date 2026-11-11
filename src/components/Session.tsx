import { useEffect, useState } from 'react'
import { DOMAINS } from '../types'
import type { Attempt, Question } from '../types'
import { isCorrect, isMultiSelect } from '../lib/quiz'
import { buildStudyPrompt } from '../lib/studyPrompt'

export interface SessionResult {
  question: Question
  selected: string[]
  correct: boolean
}

interface Props {
  questions: Question[]
  bookmarks: string[]
  onAnswer: (attempt: Attempt) => void
  onToggleBookmark: (questionId: string) => void
  onFinish: (results: SessionResult[]) => void
  onQuit: () => void
}

const LETTERS = 'ABCDEFGH'
const NUMBER_WORDS = ['', 'one', 'two', 'three', 'four', 'five']

export function Session({ questions, bookmarks, onAnswer, onToggleBookmark, onFinish, onQuit }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [results, setResults] = useState<SessionResult[]>([])

  const q = questions[index]
  const multi = isMultiSelect(q)
  const checked = results.length > index
  const result = results[index]
  const isLast = index === questions.length - 1
  const bookmarked = bookmarks.includes(q.id)
  const canCheck = multi ? selected.length === q.correct.length : selected.length === 1
  const correctSoFar = results.filter((r) => r.correct).length

  const toggle = (id: string) => {
    if (checked) return
    if (!multi) return setSelected([id])
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < q.correct.length ? [...s, id] : s,
    )
  }

  const check = () => {
    if (!canCheck || checked) return
    const correct = isCorrect(q, selected)
    onAnswer({ questionId: q.id, selected, correct, timestamp: Date.now() })
    setResults((r) => [...r, { question: q, selected, correct }])
  }

  const next = () => {
    if (isLast) return onFinish(results)
    setIndex((i) => i + 1)
    setSelected([])
    window.scrollTo({ top: 0 })
  }

  const quit = () => {
    if (results.length === 0 || confirm('Quit this session? Answers so far are already saved.')) onQuit()
  }

  // Keyboard: A–E or 1–5 pick an option, Enter checks / goes next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        return checked ? next() : check()
      }
      const k = e.key.toUpperCase()
      const i = /^[1-9]$/.test(k) ? Number(k) - 1 : LETTERS.indexOf(k)
      if (i >= 0 && i < q.options.length) toggle(q.options[i].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const optionClass = (id: string) => {
    const classes = ['option']
    if (selected.includes(id)) classes.push('selected')
    if (checked) {
      if (q.correct.includes(id)) classes.push('correct')
      else if (selected.includes(id)) classes.push('wrong')
      else classes.push('dim')
    }
    return classes.join(' ')
  }

  const progressPct = ((index + (checked ? 1 : 0)) / questions.length) * 100

  return (
    <>
      <div className="session-bar">
        <div className="session-meta">
          <span>
            Question <strong>{index + 1}</strong> of {questions.length}
          </span>
          <span className="muted">
            {correctSoFar}/{results.length} correct
          </span>
        </div>
        <div className="bar thin">
          <div className="bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <section className="card">
        <div className="session-top">
          <span className="tag">{DOMAINS.find((d) => d.id === q.domain)?.name}</span>
          <button
            className={`icon-btn ${bookmarked ? 'on' : ''}`}
            onClick={() => onToggleBookmark(q.id)}
            aria-pressed={bookmarked}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark for review'}
          >
            {bookmarked ? '★' : '☆'} <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>

        <p className="question-text">{q.text}</p>
        {multi && (
          <p className="hint">
            Select {NUMBER_WORDS[q.correct.length] ?? q.correct.length} answers ({selected.length}/{q.correct.length})
          </p>
        )}

        <ul className="options">
          {q.options.map((o, i) => (
            <li key={o.id}>
              <label className={optionClass(o.id)}>
                <input
                  type={multi ? 'checkbox' : 'radio'}
                  name={q.id}
                  className="visually-hidden"
                  checked={selected.includes(o.id)}
                  disabled={checked}
                  onChange={() => toggle(o.id)}
                />
                <span className="letter">{LETTERS[i]}</span>
                <span className="option-body">
                  {o.text}
                  {checked && o.note && <span className="note">{o.note}</span>}
                </span>
                {checked && q.correct.includes(o.id) && <span className="verdict ok">✓</span>}
                {checked && !q.correct.includes(o.id) && selected.includes(o.id) && (
                  <span className="verdict bad">✗</span>
                )}
              </label>
            </li>
          ))}
        </ul>

        {checked && (
          <div className={`feedback ${result.correct ? 'ok' : 'bad'}`}>
            <div className="feedback-head">
              <strong>{result.correct ? '✓ Correct!' : '✗ Not quite'}</strong>
              <CopyPromptButton key={q.id} text={buildStudyPrompt(q, result.selected, result.correct)} />
            </div>
            <p>{q.explanation}</p>
          </div>
        )}

        <div className="actions spread">
          <button className="link" onClick={quit}>
            Quit
          </button>
          {!checked ? (
            <button className="primary" onClick={check} disabled={!canCheck}>
              Check answer
            </button>
          ) : (
            <button className="primary" onClick={next}>
              {isLast ? 'See results →' : 'Next question →'}
            </button>
          )}
        </div>
      </section>
      <p className="muted small-text center">Tip: press A–E to choose, Enter to check / continue.</p>
    </>
  )
}

function CopyPromptButton({ text }: { text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = () =>
    navigator.clipboard.writeText(text).then(
      () => setStatus('copied'),
      () => setStatus('failed'),
    )
  const label = { idle: '📋 Copy study prompt', copied: '✓ Copied', failed: 'Copy failed' }[status]
  return (
    <button className="small" onClick={copy} title="Copy a prompt to paste into an AI assistant for deeper study">
      {label}
    </button>
  )
}
