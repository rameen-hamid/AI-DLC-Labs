export type Idea = {
  id: string
  text: string
  /** Milliseconds since epoch. */
  createdAt: number
}

export type Priority = 'high' | 'medium' | 'low'
export type Status = 'todo' | 'in-progress' | 'completed'

export type Task = {
  id: string
  text: string
  priority: Priority
  status: Status
  /** Milliseconds since epoch. */
  createdAt: number
}

/** Returned by add/edit operations on both ideas and tasks. */
export type SubmitResult = { saved: true } | { saved: false; error?: string }
