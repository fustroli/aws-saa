import { describe, expect, it } from 'vitest'
import type { Question } from '../types'
import { buildStudyPrompt } from './studyPrompt'

const q: Question = {
  id: 'x',
  domain: 'secure',
  text: 'Which is best?',
  // Display order (already shuffled): letters follow this order, not the ids.
  options: [
    { id: 'c', text: 'Gamma' },
    { id: 'a', text: 'Alpha' },
    { id: 'b', text: 'Beta' },
  ],
  correct: ['a'],
  explanation: '',
}

describe('buildStudyPrompt', () => {
  it('wrong answer: lists correct and chosen options with display letters', () => {
    const p = buildStudyPrompt(q, ['c'], false)
    expect(p).toContain('<question>\nWhich is best?\n\nA. Gamma\nB. Alpha\nC. Beta\n</question>')
    expect(p).toContain('Correct answer:\nB. Alpha')
    expect(p).toContain('My answer:\nA. Gamma')
    expect(p).toContain('2. Why my answer is incorrect')
  })

  it('correct answer: uses the deepen-understanding prompt', () => {
    const p = buildStudyPrompt(q, ['a'], true)
    expect(p).toContain('I selected the correct answer:\nB. Alpha')
    expect(p).toContain('4. A harder follow-up practice question')
    expect(p).not.toContain('My answer:')
  })

  it('multi-select lists every option in display order', () => {
    const multi = { ...q, correct: ['b', 'c'] }
    expect(buildStudyPrompt(multi, ['a', 'c'], false)).toContain('Correct answer:\nA. Gamma\nC. Beta')
  })
})
