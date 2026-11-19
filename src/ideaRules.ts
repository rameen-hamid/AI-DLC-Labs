import type { Idea } from './types'

export const MAX_IDEA_LENGTH = 200

export function normalizeText(text: string): string {
  return text.trim().toLowerCase()
}

/**
 * Returns an error message, or null when the text can be saved.
 * `ignoreId` excludes one idea (the one being edited) from the duplicate check.
 */
export function validateIdeaText(
  text: string,
  ideas: Idea[],
  ignoreId?: string,
): string | null {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return 'Idea text is required.'
  }
  if (trimmed.length > MAX_IDEA_LENGTH) {
    return `Idea text is ${trimmed.length} characters. The limit is ${MAX_IDEA_LENGTH}.`
  }
  const normalized = normalizeText(trimmed)
  const isDuplicate = ideas.some(
    (idea) => idea.id !== ignoreId && normalizeText(idea.text) === normalized,
  )
  if (isDuplicate) {
    return 'This idea already exists.'
  }
  return null
}
