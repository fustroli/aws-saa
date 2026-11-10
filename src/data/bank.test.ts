import { describe, expect, it } from 'vitest'
import { DOMAINS, type Question } from '../types'
import { BANK_FILES, QUESTIONS } from './questions'

const FILE_NAME = /^(secure|resilient|performant|cost)-(\d\.\d)\.json$/
const CHOOSE = /\(Choose (TWO|THREE)\.\)/
const COUNT_WORD: Record<number, string> = { 2: 'TWO', 3: 'THREE' }
// Real exam shape: single answer has 4 options; Choose TWO has 5; Choose THREE has 6.
const OPTION_COUNT: Record<number, number> = { 1: 4, 2: 5, 3: 6 }
const letters = (n: number) => 'abcdefghij'.slice(0, n).split('')

// Length tells: a key much longer than every distractor gives the answer away.
const KEY_LENGTH_RATIO = 1.3
// Chance that the key is the longest of 4 options is 25%; allow some slack.
const KEY_LONGEST_RATE = 0.4
// Jaccard similarity of stem + key words above which two questions test the same scenario.
// Measured on the bank: true duplicates scored 0.48-0.75, the next-closest distinct pair 0.39.
const DUPLICATE_SIMILARITY = 0.45

const STOP_WORDS = new Set(
  'a an the and or of to in for on with by is are that this it be as at from which will solution company requirements meet must needs wants'.split(' '),
)
const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  )
const jaccard = (a: Set<string>, b: Set<string>) => {
  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  return shared / (a.size + b.size - shared)
}
const keyLength = (q: Question) => q.options.find((o) => o.id === q.correct[0])!.text.length
const longestDistractor = (q: Question) => Math.max(...q.options.filter((o) => o.id !== q.correct[0]).map((o) => o.text.length))

describe('question bank', () => {
  it('has a valid file name for every bank file', () => {
    for (const file of Object.keys(BANK_FILES)) expect(file).toMatch(FILE_NAME)
  })

  it('has unique ids and unique question text', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i), 'duplicate ids').toEqual([])
    const texts = QUESTIONS.map((q) => q.text.trim().toLowerCase())
    expect(QUESTIONS.filter((_, i) => texts.indexOf(texts[i]) !== i).map((q) => q.id), 'duplicate text').toEqual([])
  })

  it('has no near-duplicate scenarios (stem + key)', () => {
    const sigs = QUESTIONS.map((q) => words(q.text + ' ' + q.options.filter((o) => q.correct.includes(o.id)).map((o) => o.text).join(' ')))
    const pairs: string[] = []
    for (let i = 0; i < QUESTIONS.length; i++)
      for (let j = i + 1; j < QUESTIONS.length; j++) {
        const sim = jaccard(sigs[i], sigs[j])
        if (sim > DUPLICATE_SIMILARITY) pairs.push(`${QUESTIONS[i].id} ~ ${QUESTIONS[j].id} (${sim.toFixed(2)})`)
      }
    expect(pairs, 'near-duplicate questions').toEqual([])
  })

  for (const [file, questions] of Object.entries(BANK_FILES)) {
    const [, domain, task] = FILE_NAME.exec(file) ?? []

    describe(file, () => {
      it.each(questions.map((q) => [q.id, q] as const))('%s is well-formed', (_, q) => {
        expect(q.id).toMatch(new RegExp(`^${domain}-${task.replace('.', '\\.')}-\\d{2,3}$`))
        expect(q.domain).toBe(domain)
        expect(DOMAINS.map((d) => d.id)).toContain(q.domain)
        expect(q.services?.length, 'services').toBeGreaterThan(0)
        expect(q.explanation.trim(), 'explanation').not.toBe('')

        const answers = q.correct.length
        expect(OPTION_COUNT[answers], 'correct must have 1-3 answers').toBeDefined()
        expect(q.options.map((o) => o.id)).toEqual(letters(OPTION_COUNT[answers]))
        expect(new Set(q.correct).size).toBe(answers)
        for (const c of q.correct) expect(q.options.map((o) => o.id)).toContain(c)
        for (const o of q.options) expect(o.note?.trim(), `note on option ${o.id}`).toBeTruthy()

        const choose = CHOOSE.exec(q.text)
        if (answers === 1) expect(choose, 'single-answer text must not say Choose').toBeNull()
        else expect(choose?.[1]).toBe(COUNT_WORD[answers])
      })

      it('spreads single-answer correct letters (no letter above 50%)', () => {
        const singles = questions.filter((q) => q.correct.length === 1)
        if (singles.length < 8) return
        const counts = new Map<string, number>()
        for (const q of singles) counts.set(q.correct[0], (counts.get(q.correct[0]) ?? 0) + 1)
        expect(Math.max(...counts.values()) / singles.length).toBeLessThanOrEqual(0.5)
      })

      it(`has no single-answer key ${KEY_LENGTH_RATIO}x longer than every distractor`, () => {
        const tells = questions
          .filter((q) => q.correct.length === 1 && keyLength(q) >= KEY_LENGTH_RATIO * longestDistractor(q))
          .map((q) => q.id)
        expect(tells).toEqual([])
      })

      it(`has the key as the longest option in at most ${KEY_LONGEST_RATE * 100}% of single-answer questions`, () => {
        const singles = questions.filter((q) => q.correct.length === 1)
        if (singles.length < 8) return
        const longest = singles.filter((q) => keyLength(q) >= longestDistractor(q)).map((q) => q.id)
        expect(longest.length / singles.length, `key is longest: ${longest.join(', ')}`).toBeLessThanOrEqual(KEY_LONGEST_RATE)
      })
    })
  }
})
