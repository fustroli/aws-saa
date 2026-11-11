import type { Question } from '../types'

const LETTERS = 'ABCDEFGH'

/** Options as "A. text" in display order, so letters match what the user saw. */
function labelled(q: Question, ids: readonly string[]): string {
  return q.options
    .map((o, i) => ({ o, letter: LETTERS[i] }))
    .filter(({ o }) => ids.includes(o.id))
    .map(({ o, letter }) => `${letter}. ${o.text}`)
    .join('\n')
}

function questionBlock(q: Question): string {
  const options = q.options.map((o, i) => `${LETTERS[i]}. ${o.text}`).join('\n')
  return `<question>\n${q.text}\n\n${options}\n</question>`
}

const SOURCES = 'Search online for official AWS documentation and list the relevant sources you used. Be concise in your response.'

/** Builds a prompt to paste into an LLM for deeper study of an answered question. */
export function buildStudyPrompt(q: Question, selected: readonly string[], correct: boolean): string {
  const intro = "I'm studying for the AWS Certified Solutions Architect - Associate (SAA-C03) certification."

  if (correct) {
    return `${intro} On a mock exam I got this question right, but I want to solidify my understanding before the real exam.

${questionBlock(q)}

I selected the correct answer:
${labelled(q, q.correct)}

Help me deepen my understanding:
1. Why the correct answer is correct — go beyond the surface wording of the choices
2. What nuances or edge cases could still trip me up on exam day
3. Which related AWS concepts tie into this topic
4. A harder follow-up practice question. Do not give the answer yet
${SOURCES}`
  }

  return `${intro} I got the following question on a mock exam.

${questionBlock(q)}

Correct answer:
${labelled(q, q.correct)}

My answer:
${labelled(q, selected)}

Explain:
1. Why the correct answer is correct
2. Why my answer is incorrect
3. Which AWS concept or service I misunderstand
4. A simple mental model to remember the difference
5. A similar example question. Do not give the answer yet.
${SOURCES}`
}
