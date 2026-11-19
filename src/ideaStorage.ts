import type { Idea } from './types'

export const STORAGE_KEY = 'idea-board:ideas'

export type LoadResult =
  | { status: 'ok'; ideas: Idea[] }
  | { status: 'unreadable'; ideas: Idea[] }
  | { status: 'unavailable'; ideas: Idea[] }

export type SaveResult = { ok: true } | { ok: false; reason: 'full' | 'failed' }

function isIdea(value: unknown): value is Idea {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    typeof item.createdAt === 'number' &&
    Number.isFinite(item.createdAt)
  )
}

/** Reads ideas without ever writing, so unreadable data stays untouched. */
export function loadIdeas(): LoadResult {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'unavailable', ideas: [] }
  }
  if (raw === null) {
    return { status: 'ok', ideas: [] }
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(isIdea)) {
      return { status: 'ok', ideas: parsed }
    }
  } catch {
    // fall through to unreadable
  }
  return { status: 'unreadable', ideas: [] }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014)
  )
}

export function saveIdeas(ideas: Idea[]): SaveResult {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? 'full' : 'failed' }
  }
}
