import type { Idea, Task, Priority, Status } from './types'
import { normalizeText, MAX_IDEA_LENGTH } from './ideaRules'

export const PRIORITIES = ['high', 'medium', 'low'] as const
export const STATUSES = ['todo', 'in-progress', 'completed'] as const

export const DEFAULT_PRIORITY: Priority = 'medium'
export const DEFAULT_STATUS: Status = 'todo'

export const MAX_TASK_LENGTH = MAX_IDEA_LENGTH

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  completed: 'Completed',
}

/** Priority sort rank — lower number sorts first. */
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

/**
 * Returns an error message, or null when the text can be saved.
 * `ignoreId` excludes one task (the one being edited) from the duplicate check.
 */
export function validateTaskText(
  text: string,
  tasks: Task[],
  ignoreId?: string,
): string | null {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return 'Task text is required.'
  }
  if (trimmed.length > MAX_TASK_LENGTH) {
    return `Task text is ${trimmed.length} characters. The limit is ${MAX_TASK_LENGTH}.`
  }
  const normalized = normalizeText(trimmed)
  const isDuplicate = tasks.some(
    (task) => task.id !== ignoreId && normalizeText(task.text) === normalized,
  )
  if (isDuplicate) {
    return 'This task already exists.'
  }
  return null
}

/** Compares two priorities for sort order (high first). */
export function comparePriority(a: Priority, b: Priority): number {
  return PRIORITY_RANK[a] - PRIORITY_RANK[b]
}

/** Compares two tasks: by priority (high→low), then newest createdAt first. */
export function compareTasks(a: Task, b: Task): number {
  const byPriority = comparePriority(a.priority, b.priority)
  if (byPriority !== 0) return byPriority
  return b.createdAt - a.createdAt
}

/** Returns a new sorted array; never mutates the input. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(compareTasks)
}

/** Converts an Idea to a Task, applying default priority and status. */
export function ideaToTask(idea: Idea): Task {
  return {
    id: idea.id,
    text: idea.text,
    createdAt: idea.createdAt,
    priority: DEFAULT_PRIORITY,
    status: DEFAULT_STATUS,
  }
}

/** Converts a Task back to an Idea, discarding priority and status. */
export function taskToIdea(task: Task): Idea {
  return {
    id: task.id,
    text: task.text,
    createdAt: task.createdAt,
  }
}
