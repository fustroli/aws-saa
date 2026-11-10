import type { Question } from '../types'

// Each bank file is a JSON array of questions for one exam task statement, named `<domain>-<task>.json`.
// Option IDs are stable; display order is shuffled at runtime.
export const BANK_FILES: Record<string, Question[]> = Object.fromEntries(
  Object.entries(import.meta.glob<Question[]>('./bank/*.json', { eager: true, import: 'default' })).map(
    ([path, questions]) => [path.replace('./bank/', ''), questions],
  ),
)

export const QUESTIONS: Question[] = Object.values(BANK_FILES).flat()
