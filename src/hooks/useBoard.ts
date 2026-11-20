import { useState } from 'react'
import { validateIdeaText, normalizeText } from '../ideaRules'
import { loadIdeas, saveIdeas } from '../ideaStorage'
import { validateTaskText, ideaToTask, taskToIdea, sortTasks } from '../taskRules'
import { loadTasks, saveTasks } from '../taskStorage'
import type { Idea, Task, Priority, Status, SubmitResult } from '../types'

const UNAVAILABLE_IDEA_MESSAGE =
  'Idea storage is unavailable, so changes cannot be saved.'
const UNAVAILABLE_TASK_MESSAGE =
  'Task storage is unavailable, so task changes cannot be saved.'
const UNREADABLE_IDEA_MESSAGE =
  'Stored ideas could not be read. The list starts empty. Adding an idea replaces the stored data.'
const UNREADABLE_TASK_MESSAGE =
  'Stored tasks could not be read. The task list starts empty. Adding a task replaces the stored data.'

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function useBoard() {
  const [initialIdeas] = useState(loadIdeas)
  const [initialTasks] = useState(loadTasks)
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas.ideas)
  const [tasks, setTasks] = useState<Task[]>(initialTasks.tasks)
  const [ideaLoadIssue, setIdeaLoadIssue] = useState<
    'unreadable' | 'unavailable' | null
  >(initialIdeas.status === 'ok' ? null : initialIdeas.status)
  const [taskLoadIssue, setTaskLoadIssue] = useState<
    'unreadable' | 'unavailable' | null
  >(initialTasks.status === 'ok' ? null : initialTasks.status)
  const [saveError, setSaveError] = useState<string | null>(null)

  const ideaBlocked = ideaLoadIssue === 'unavailable'
  const taskBlocked = taskLoadIssue === 'unavailable'
  const blocked = ideaBlocked || taskBlocked

  // ── private commit helpers ───────────────────────────────────────────────

  function commitIdeas(next: Idea[]): boolean {
    const result = saveIdeas(next)
    if (!result.ok) {
      setSaveError(
        result.reason === 'full'
          ? 'Not saved: idea storage is full. Nothing was changed.'
          : 'Not saved: ideas could not be written to storage. Nothing was changed.',
      )
      return false
    }
    setSaveError(null)
    setIdeas(next)
    return true
  }

  function commitTasks(next: Task[]): boolean {
    const result = saveTasks(next)
    if (!result.ok) {
      setSaveError(
        result.reason === 'full'
          ? 'Not saved: task storage is full. Nothing was changed.'
          : 'Not saved: tasks could not be written to storage. Nothing was changed.',
      )
      return false
    }
    setSaveError(null)
    setTasks(next)
    return true
  }

  /**
   * Writes both collections atomically from the user's point of view.
   * Tasks are written first; if the second write (ideas) fails, the tasks
   * key is restored as a best-effort rollback. React state is only updated
   * when both writes succeed.
   */
  function commitBoard(nextIdeas: Idea[], nextTasks: Task[]): boolean {
    const taskResult = saveTasks(nextTasks)
    if (!taskResult.ok) {
      setSaveError(
        taskResult.reason === 'full'
          ? 'Not saved: task storage is full. Nothing was changed.'
          : 'Not saved: tasks could not be written to storage. Nothing was changed.',
      )
      return false
    }
    const ideaResult = saveIdeas(nextIdeas)
    if (!ideaResult.ok) {
      // Best-effort rollback of the tasks key.
      saveTasks(tasks)
      setSaveError(
        ideaResult.reason === 'full'
          ? 'Not saved: idea storage is full. Nothing was changed.'
          : 'Not saved: ideas could not be written to storage. Nothing was changed.',
      )
      return false
    }
    setSaveError(null)
    setIdeas(nextIdeas)
    setTasks(nextTasks)
    return true
  }

  // ── idea operations (unchanged behaviour) ────────────────────────────────

  function addIdea(text: string): SubmitResult {
    if (ideaBlocked) return { saved: false }
    const error = validateIdeaText(text, ideas)
    if (error) return { saved: false, error }
    const idea: Idea = { id: createId(), text: text.trim(), createdAt: Date.now() }
    if (!commitIdeas([idea, ...ideas])) return { saved: false }
    setIdeaLoadIssue(null)
    return { saved: true }
  }

  function editIdea(id: string, text: string): SubmitResult {
    if (ideaBlocked) return { saved: false }
    const error = validateIdeaText(text, ideas, id)
    if (error) return { saved: false, error }
    const next = ideas.map((idea) =>
      idea.id === id ? { ...idea, text: text.trim() } : idea,
    )
    return commitIdeas(next) ? { saved: true } : { saved: false }
  }

  function deleteIdea(id: string): boolean {
    if (ideaBlocked) return false
    return commitIdeas(ideas.filter((idea) => idea.id !== id))
  }

  function clearIdeas(): boolean {
    if (ideaBlocked || ideas.length === 0) return false
    return commitIdeas([])
  }

  // ── task operations ───────────────────────────────────────────────────────

  function convertIdeaToTask(ideaId: string): SubmitResult {
    if (blocked) return { saved: false }
    const idea = ideas.find((i) => i.id === ideaId)
    if (!idea) return { saved: false, error: 'Idea not found.' }
    const task = ideaToTask(idea)
    const nextIdeas = ideas.filter((i) => i.id !== ideaId)
    const nextTasks = [task, ...tasks]
    return commitBoard(nextIdeas, nextTasks) ? { saved: true } : { saved: false }
  }

  function convertTaskToIdea(taskId: string): SubmitResult {
    if (blocked) return { saved: false }
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return { saved: false, error: 'Task not found.' }
    // Block if an idea with the same normalised text already exists.
    const normalized = normalizeText(task.text)
    const conflict = ideas.some((i) => normalizeText(i.text) === normalized)
    if (conflict) {
      return { saved: false, error: 'An idea with this text already exists.' }
    }
    const idea = taskToIdea(task)
    const nextTasks = tasks.filter((t) => t.id !== taskId)
    const nextIdeas = [idea, ...ideas]
    return commitBoard(nextIdeas, nextTasks) ? { saved: true } : { saved: false }
  }

  function editTask(id: string, text: string): SubmitResult {
    if (taskBlocked) return { saved: false }
    const error = validateTaskText(text, tasks, id)
    if (error) return { saved: false, error }
    const next = tasks.map((task) =>
      task.id === id ? { ...task, text: text.trim() } : task,
    )
    return commitTasks(next) ? { saved: true } : { saved: false }
  }

  function setPriority(id: string, priority: Priority): boolean {
    if (taskBlocked) return false
    const next = tasks.map((task) => (task.id === id ? { ...task, priority } : task))
    return commitTasks(next)
  }

  function setStatus(id: string, status: Status): boolean {
    if (taskBlocked) return false
    const next = tasks.map((task) => (task.id === id ? { ...task, status } : task))
    return commitTasks(next)
  }

  function deleteTask(id: string): boolean {
    if (taskBlocked) return false
    return commitTasks(tasks.filter((task) => task.id !== id))
  }

  function clearTasks(): boolean {
    if (taskBlocked || tasks.length === 0) return false
    const result = commitTasks([])
    if (result) setTaskLoadIssue(null)
    return result
  }

  // ── notice ────────────────────────────────────────────────────────────────

  const noticeParts: string[] = []
  if (ideaLoadIssue === 'unavailable') noticeParts.push(UNAVAILABLE_IDEA_MESSAGE)
  else if (ideaLoadIssue === 'unreadable') noticeParts.push(UNREADABLE_IDEA_MESSAGE)
  if (taskLoadIssue === 'unavailable') noticeParts.push(UNAVAILABLE_TASK_MESSAGE)
  else if (taskLoadIssue === 'unreadable') noticeParts.push(UNREADABLE_TASK_MESSAGE)
  const notice = noticeParts.length > 0 ? noticeParts.join(' ') : null

  return {
    ideas,
    tasks,
    sortedTasks: sortTasks(tasks),
    blocked,
    ideaBlocked,
    taskBlocked,
    notice,
    saveError,
    // idea ops
    addIdea,
    editIdea,
    deleteIdea,
    clearIdeas,
    // task ops
    convertIdeaToTask,
    convertTaskToIdea,
    editTask,
    setPriority,
    setStatus,
    deleteTask,
    clearTasks,
  }
}
