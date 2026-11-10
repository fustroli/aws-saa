import { describe, expect, it } from 'vitest'
import type { Attempt, Question } from '../types'
import { computeStats, filterByDomain, isCorrect, percent, reviewPool, selectQuestions, shuffle } from './quiz'

const q = (id: string, correct: string[], domain: Question['domain'] = 'secure'): Question => ({
  id,
  domain,
  text: id,
  options: ['a', 'b', 'c', 'd', 'e'].map((o) => ({ id: o, text: o })),
  correct,
  explanation: '',
})

const attempt = (questionId: string, correct: boolean, timestamp: number): Attempt => ({
  questionId,
  selected: [],
  correct,
  timestamp,
})

describe('isCorrect', () => {
  it('single answer', () => {
    expect(isCorrect(q('1', ['b']), ['b'])).toBe(true)
    expect(isCorrect(q('1', ['b']), ['a'])).toBe(false)
  })

  it('multi-select is all-or-nothing', () => {
    const multi = q('1', ['a', 'c'])
    expect(isCorrect(multi, ['c', 'a'])).toBe(true)
    expect(isCorrect(multi, ['a'])).toBe(false)
    expect(isCorrect(multi, ['a', 'b'])).toBe(false)
    expect(isCorrect(multi, ['a', 'c', 'd'])).toBe(false)
    expect(isCorrect(multi, ['a', 'a'])).toBe(false)
  })
})

describe('selectQuestions', () => {
  const pool = ['1', '2', '3', '4'].map((id) => q(id, ['a']))

  it('puts never-attempted questions first', () => {
    const attempts = [attempt('1', true, 1), attempt('2', false, 2)]
    for (let i = 0; i < 20; i++) {
      const ids = selectQuestions(pool, attempts, 4).map((x) => x.id)
      expect(ids.slice(0, 2).sort()).toEqual(['3', '4'])
      expect(ids.slice(2).sort()).toEqual(['1', '2'])
    }
  })

  it('caps at count and handles Infinity', () => {
    expect(selectQuestions(pool, [], 2)).toHaveLength(2)
    expect(selectQuestions(pool, [], Infinity)).toHaveLength(4)
  })
})

describe('shuffle', () => {
  it('keeps all items and does not mutate input', () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffle(input)
    expect([...out].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})

describe('reviewPool', () => {
  const questions = ['1', '2', '3'].map((id) => q(id, ['a']))

  it('uses the most recent attempt to decide "wrong"', () => {
    const attempts = [
      attempt('1', false, 1),
      attempt('1', true, 2), // fixed later -> not wrong
      attempt('2', true, 1),
      attempt('2', false, 3), // broke later -> wrong
    ]
    expect(reviewPool(questions, attempts, [], 'wrong').map((x) => x.id)).toEqual(['2'])
  })

  it('handles bookmarked and both', () => {
    const attempts = [attempt('1', false, 1)]
    expect(reviewPool(questions, attempts, ['3'], 'bookmarked').map((x) => x.id)).toEqual(['3'])
    expect(reviewPool(questions, attempts, ['3'], 'both').map((x) => x.id)).toEqual(['1', '3'])
  })
})

describe('computeStats', () => {
  it('aggregates overall and per domain, ignoring unknown questions', () => {
    const questions = [q('s', ['a'], 'secure'), q('c', ['a'], 'cost')]
    const attempts = [attempt('s', true, 1), attempt('s', false, 2), attempt('c', true, 3), attempt('gone', true, 4)]
    const stats = computeStats(questions, attempts)
    expect(stats.overall).toEqual({ correct: 2, total: 3 })
    expect(stats.byDomain.secure).toEqual({ correct: 1, total: 2 })
    expect(stats.byDomain.cost).toEqual({ correct: 1, total: 1 })
    expect(stats.byDomain.resilient).toEqual({ correct: 0, total: 0 })
    expect(stats.attempted).toBe(2)
    expect(percent(stats.overall)).toBe(67)
    expect(percent({ correct: 0, total: 0 })).toBe(0)
  })
})

describe('filterByDomain', () => {
  it('filters or returns all', () => {
    const questions = [q('s', ['a'], 'secure'), q('c', ['a'], 'cost')]
    expect(filterByDomain(questions, 'all')).toHaveLength(2)
    expect(filterByDomain(questions, 'cost').map((x) => x.id)).toEqual(['c'])
  })
})
