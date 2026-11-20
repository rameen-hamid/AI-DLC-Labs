import { useState } from 'react'
import { validateIdeaText } from '../ideaRules'
import { loadIdeas, saveIdeas } from '../ideaStorage'
import type { Idea, SubmitResult } from '../types'

export type { SubmitResult }

const UNAVAILABLE_MESSAGE =
  'Local storage is unavailable, so changes cannot be saved.'
const UNREADABLE_MESSAGE =
  'The stored ideas could not be read. The list starts empty. Adding an idea replaces the stored data.'

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function useIdeas() {
  const [initial] = useState(loadIdeas)
  const [ideas, setIdeas] = useState<Idea[]>(initial.ideas)
  const [loadIssue, setLoadIssue] = useState<'unreadable' | 'unavailable' | null>(
    initial.status === 'ok' ? null : initial.status,
  )
  const [saveError, setSaveError] = useState<string | null>(null)

  const blocked = loadIssue === 'unavailable'

  /** Writes first; updates state only when the write succeeded. */
  function commit(next: Idea[]): boolean {
    const result = saveIdeas(next)
    if (!result.ok) {
      setSaveError(
        result.reason === 'full'
          ? 'Not saved: local storage is full. Nothing was changed.'
          : 'Not saved: the change could not be written to local storage. Nothing was changed.',
      )
      return false
    }
    setSaveError(null)
    setIdeas(next)
    return true
  }

  function addIdea(text: string): SubmitResult {
    if (blocked) return { saved: false }
    const error = validateIdeaText(text, ideas)
    if (error) return { saved: false, error }
    const idea: Idea = { id: createId(), text: text.trim(), createdAt: Date.now() }
    if (!commit([idea, ...ideas])) return { saved: false }
    // The unreadable data has now been replaced.
    setLoadIssue(null)
    return { saved: true }
  }

  function editIdea(id: string, text: string): SubmitResult {
    if (blocked) return { saved: false }
    const error = validateIdeaText(text, ideas, id)
    if (error) return { saved: false, error }
    const next = ideas.map((idea) =>
      idea.id === id ? { ...idea, text: text.trim() } : idea,
    )
    return commit(next) ? { saved: true } : { saved: false }
  }

  function deleteIdea(id: string): boolean {
    if (blocked) return false
    return commit(ideas.filter((idea) => idea.id !== id))
  }

  function clearIdeas(): boolean {
    if (blocked || ideas.length === 0) return false
    return commit([])
  }

  const notice =
    loadIssue === 'unavailable'
      ? UNAVAILABLE_MESSAGE
      : loadIssue === 'unreadable'
        ? UNREADABLE_MESSAGE
        : null

  return {
    ideas,
    blocked,
    notice,
    saveError,
    addIdea,
    editIdea,
    deleteIdea,
    clearIdeas,
  }
}
