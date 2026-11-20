import type { Task } from './types'
import { PRIORITIES, STATUSES } from './taskRules'

export const TASKS_KEY = 'idea-board:tasks'

export type LoadTasksResult =
  | { status: 'ok'; tasks: Task[] }
  | { status: 'unreadable'; tasks: Task[] }
  | { status: 'unavailable'; tasks: Task[] }

export type SaveTasksResult = { ok: true } | { ok: false; reason: 'full' | 'failed' }

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    typeof item.createdAt === 'number' &&
    Number.isFinite(item.createdAt) &&
    (PRIORITIES as readonly unknown[]).includes(item.priority) &&
    (STATUSES as readonly unknown[]).includes(item.status)
  )
}

/** Reads tasks without ever writing, so unreadable data stays untouched. */
export function loadTasks(): LoadTasksResult {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(TASKS_KEY)
  } catch {
    return { status: 'unavailable', tasks: [] }
  }
  if (raw === null) {
    return { status: 'ok', tasks: [] }
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(isTask)) {
      return { status: 'ok', tasks: parsed }
    }
  } catch {
    // fall through to unreadable
  }
  return { status: 'unreadable', tasks: [] }
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

export function saveTasks(tasks: Task[]): SaveTasksResult {
  try {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? 'full' : 'failed' }
  }
}
