import type { Idea, Task, Priority, Status } from './types'
import {
  PRIORITIES,
  STATUSES,
  DEFAULT_PRIORITY,
  DEFAULT_STATUS,
  validateTaskText,
  comparePriority,
  sortTasks,
  ideaToTask,
  taskToIdea,
} from './taskRules'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return { id: 'i1', text: 'An idea', createdAt: 1000, ...overrides }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    text: 'A task',
    priority: 'medium',
    status: 'todo',
    createdAt: 1000,
    ...overrides,
  }
}

// ── Property 1: ideaToTask carries identity and applies defaults ──────────────

describe('ideaToTask', () => {
  it('carries id, text and createdAt from the idea', () => {
    const idea = makeIdea({ id: 'abc', text: 'hello', createdAt: 9999 })
    const task = ideaToTask(idea)
    expect(task.id).toBe('abc')
    expect(task.text).toBe('hello')
    expect(task.createdAt).toBe(9999)
  })

  it('defaults priority to medium', () => {
    expect(ideaToTask(makeIdea()).priority).toBe(DEFAULT_PRIORITY)
    expect(DEFAULT_PRIORITY).toBe('medium')
  })

  it('defaults status to todo', () => {
    expect(ideaToTask(makeIdea()).status).toBe(DEFAULT_STATUS)
    expect(DEFAULT_STATUS).toBe('todo')
  })
})

// ── Property 2: taskToIdea carries identity and drops priority/status ─────────

describe('taskToIdea', () => {
  it('carries id, text and createdAt from the task', () => {
    const task = makeTask({ id: 'xyz', text: 'do it', createdAt: 42 })
    const idea = taskToIdea(task)
    expect(idea.id).toBe('xyz')
    expect(idea.text).toBe('do it')
    expect(idea.createdAt).toBe(42)
  })

  it('does not include priority or status in the result', () => {
    const idea = taskToIdea(makeTask({ priority: 'high', status: 'completed' }))
    expect('priority' in idea).toBe(false)
    expect('status' in idea).toBe(false)
  })
})

// ── Property 3: round-trip ────────────────────────────────────────────────────

describe('round-trip: taskToIdea(ideaToTask(idea)) === idea', () => {
  it('restores the original idea', () => {
    const original = makeIdea({ id: 'r1', text: 'round trip', createdAt: 7 })
    expect(taskToIdea(ideaToTask(original))).toEqual(original)
  })
})

// ── Property 5: sortTasks orders high→medium→low then newest-first ────────────

describe('sortTasks', () => {
  const tasks: Task[] = [
    makeTask({ id: '1', priority: 'low', createdAt: 100 }),
    makeTask({ id: '2', priority: 'high', createdAt: 200 }),
    makeTask({ id: '3', priority: 'medium', createdAt: 300 }),
    makeTask({ id: '4', priority: 'high', createdAt: 50 }),
  ]

  it('orders high before medium before low', () => {
    const sorted = sortTasks(tasks)
    const priorities = sorted.map((t) => t.priority)
    expect(priorities.indexOf('high')).toBeLessThan(priorities.indexOf('medium'))
    expect(priorities.indexOf('medium')).toBeLessThan(priorities.indexOf('low'))
  })

  it('orders newest-first within the same priority', () => {
    const sorted = sortTasks(tasks)
    const highIds = sorted.filter((t) => t.priority === 'high').map((t) => t.id)
    // id '2' has createdAt 200 (newer) so it should come before id '4' (createdAt 50)
    expect(highIds[0]).toBe('2')
    expect(highIds[1]).toBe('4')
  })

  it('does not mutate the input array', () => {
    const original = [...tasks]
    sortTasks(tasks)
    expect(tasks).toEqual(original)
  })
})

// ── Property 6: ordering is independent of status ─────────────────────────────

describe('sortTasks status independence', () => {
  it('completed tasks keep their sorted position (status does not affect order)', () => {
    const a = makeTask({ id: 'a', priority: 'high', status: 'completed', createdAt: 1 })
    const b = makeTask({ id: 'b', priority: 'low', status: 'todo', createdAt: 2 })
    const sorted = sortTasks([b, a])
    expect(sorted[0].id).toBe('a') // high before low regardless of status
    expect(sorted[1].id).toBe('b')
  })
})

// ── Property 7: validateTaskText ──────────────────────────────────────────────

describe('validateTaskText', () => {
  const existing: Task[] = [makeTask({ id: 'e1', text: 'Existing task' })]

  it('rejects empty string', () => {
    expect(validateTaskText('', [])).toBeTruthy()
  })

  it('rejects whitespace-only string', () => {
    expect(validateTaskText('   ', [])).toBeTruthy()
  })

  it('rejects text over 200 chars (after trim)', () => {
    expect(validateTaskText('x'.repeat(201), [])).toBeTruthy()
  })

  it('accepts text exactly 200 chars', () => {
    expect(validateTaskText('x'.repeat(200), [])).toBeNull()
  })

  it('rejects case-insensitive duplicate', () => {
    expect(validateTaskText('EXISTING TASK', existing)).toBeTruthy()
  })

  it('rejects duplicate after trimming spaces', () => {
    expect(validateTaskText('  Existing task  ', existing)).toBeTruthy()
  })

  it('allows text that differs only in internal whitespace', () => {
    expect(validateTaskText('Existing  task', existing)).toBeNull()
  })

  it('allows the editing task itself (ignoreId)', () => {
    expect(validateTaskText('Existing task', existing, 'e1')).toBeNull()
  })

  it('still rejects duplicate of another task when ignoreId is set', () => {
    const tasks: Task[] = [
      makeTask({ id: 'e1', text: 'Task one' }),
      makeTask({ id: 'e2', text: 'Task two' }),
    ]
    expect(validateTaskText('Task two', tasks, 'e1')).toBeTruthy()
  })
})

// ── comparePriority ────────────────────────────────────────────────────────────

describe('comparePriority', () => {
  const allPairs: [Priority, Priority, number][] = [
    ['high', 'medium', -1],
    ['high', 'low', -1],
    ['medium', 'low', -1],
    ['medium', 'high', 1],
    ['low', 'high', 1],
    ['low', 'medium', 1],
    ['high', 'high', 0],
    ['medium', 'medium', 0],
    ['low', 'low', 0],
  ]
  it.each(allPairs)('comparePriority(%s, %s) has correct sign', (a, b, expected) => {
    const result = comparePriority(a, b)
    if (expected < 0) expect(result).toBeLessThan(0)
    else if (expected > 0) expect(result).toBeGreaterThan(0)
    else expect(result).toBe(0)
  })
})

// ── constant shapes ────────────────────────────────────────────────────────────

describe('PRIORITIES and STATUSES', () => {
  it('PRIORITIES contains exactly high, medium, low', () => {
    expect([...PRIORITIES].sort()).toEqual(['high', 'low', 'medium'])
  })

  it('STATUSES contains exactly todo, in-progress, completed', () => {
    expect([...STATUSES].sort()).toEqual(['completed', 'in-progress', 'todo'])
  })

  it('DEFAULT_PRIORITY is in PRIORITIES', () => {
    expect((PRIORITIES as readonly string[]).includes(DEFAULT_PRIORITY)).toBe(true)
  })

  it('DEFAULT_STATUS is in STATUSES', () => {
    expect((STATUSES as readonly string[]).includes(DEFAULT_STATUS as Status)).toBe(true)
  })
})
