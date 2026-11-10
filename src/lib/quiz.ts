import { DOMAINS } from '../types'
import type { Attempt, DomainId, Question, ReviewSource } from '../types'

export type Rng = () => number

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const isMultiSelect = (q: Question) => q.correct.length > 1

/** All-or-nothing: the selection must match the correct set exactly. */
export function isCorrect(q: Question, selected: readonly string[]): boolean {
  const sel = new Set(selected)
  return sel.size === q.correct.length && q.correct.every((id) => sel.has(id))
}

/** Picks `count` questions at random, never-attempted ones first. */
export function selectQuestions(
  pool: readonly Question[],
  attempts: readonly Attempt[],
  count: number,
  rng: Rng = Math.random,
): Question[] {
  const seen = new Set(attempts.map((a) => a.questionId))
  const unseen = shuffle(pool.filter((q) => !seen.has(q.id)), rng)
  const rest = shuffle(pool.filter((q) => seen.has(q.id)), rng)
  return [...unseen, ...rest].slice(0, count)
}

export function filterByDomain(questions: readonly Question[], domain: DomainId | 'all'): Question[] {
  return domain === 'all' ? [...questions] : questions.filter((q) => q.domain === domain)
}

/** Most recent attempt per question. */
export function latestAttempts(attempts: readonly Attempt[]): Map<string, Attempt> {
  const latest = new Map<string, Attempt>()
  for (const a of attempts) {
    const prev = latest.get(a.questionId)
    if (!prev || a.timestamp >= prev.timestamp) latest.set(a.questionId, a)
  }
  return latest
}

export function reviewPool(
  questions: readonly Question[],
  attempts: readonly Attempt[],
  bookmarks: readonly string[],
  source: ReviewSource,
): Question[] {
  const latest = latestAttempts(attempts)
  const marked = new Set(bookmarks)
  const isWrong = (q: Question) => latest.get(q.id)?.correct === false
  return questions.filter((q) => {
    if (source === 'wrong') return isWrong(q)
    if (source === 'bookmarked') return marked.has(q.id)
    return isWrong(q) || marked.has(q.id)
  })
}

export interface Accuracy {
  correct: number
  total: number
}

export interface Stats {
  overall: Accuracy
  byDomain: Record<DomainId, Accuracy>
  attempted: number
  totalQuestions: number
}

/** Accuracy counts every attempt; `attempted` counts distinct questions. */
export function computeStats(questions: readonly Question[], attempts: readonly Attempt[]): Stats {
  const domainOf = new Map(questions.map((q) => [q.id, q.domain]))
  const byDomain = Object.fromEntries(DOMAINS.map((d) => [d.id, { correct: 0, total: 0 }])) as Record<
    DomainId,
    Accuracy
  >
  const overall = { correct: 0, total: 0 }
  for (const a of attempts) {
    const domain = domainOf.get(a.questionId)
    if (!domain) continue // question removed from the bank
    for (const acc of [overall, byDomain[domain]]) {
      acc.total++
      if (a.correct) acc.correct++
    }
  }
  const attempted = new Set(attempts.filter((a) => domainOf.has(a.questionId)).map((a) => a.questionId)).size
  return { overall, byDomain, attempted, totalQuestions: questions.length }
}

export const percent = ({ correct, total }: Accuracy) => (total === 0 ? 0 : Math.round((correct / total) * 100))

/** Colour band for an accuracy %; 72% ≈ the 720/1000 passing score. */
export const accuracyLevel = (pct: number) => (pct >= 72 ? 'good' : pct >= 50 ? 'mid' : 'low')
