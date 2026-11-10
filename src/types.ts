export const DOMAINS = [
  { id: 'secure', name: 'Design Secure Architectures', weight: 30 },
  { id: 'resilient', name: 'Design Resilient Architectures', weight: 26 },
  { id: 'performant', name: 'Design High-Performing Architectures', weight: 24 },
  { id: 'cost', name: 'Design Cost-Optimized Architectures', weight: 20 },
] as const

export type DomainId = (typeof DOMAINS)[number]['id']

export interface Option {
  id: string
  text: string
  /** Optional note on why this option is right or wrong. */
  note?: string
}

export interface Question {
  id: string
  domain: DomainId
  services?: string[]
  text: string
  options: Option[]
  /** IDs of the correct options. More than one makes it a multi-select question. */
  correct: string[]
  explanation: string
}

export interface Attempt {
  questionId: string
  selected: string[]
  correct: boolean
  timestamp: number
}

export interface Progress {
  attempts: Attempt[]
  bookmarks: string[]
}

export type ReviewSource = 'wrong' | 'bookmarked' | 'both'
